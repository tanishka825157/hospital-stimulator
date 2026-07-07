import { createAmbulances, type Ambulance } from "@/engine/Ambulance";
import { createDoctors, treatmentDuration, type Doctor, type DoctorStatus } from "@/engine/Doctor";
import { createICUBeds, icuDuration, type ICUBed } from "@/engine/ICU";
import { generatePatient, patientComparator, severityWeight, escalatePatient, type Patient, type Severity } from "@/engine/Patient";
import { EventLog, type SimEvent } from "@/engine/events";
import { PriorityQueue } from "@/engine/PriorityQueue";

export interface SimulationConfig {
  arrivalRate: number;
  doctorCount: number;
  icuBedCount: number;
  ambulanceCount: number;
  speed: number;
}

export interface MetricsPoint {
  tick: number;
  queueLength: number;
  doctorUtilization: number;
  icuUtilization: number;
}

export interface SimulationStats {
  totalArrived: number;
  treated: number;
  escalated: number;
  averageWaitBySeverity: Record<Severity, number>;
  peakLoadTick: number;
}

export interface SimulationSnapshot {
  running: boolean;
  tick: number;
  config: SimulationConfig;
  queue: Patient[];
  doctors: Doctor[];
  icuBeds: ICUBed[];
  ambulances: Ambulance[];
  events: SimEvent[];
  metrics: MetricsPoint[];
  stats: SimulationStats;
  capacityCrisis: boolean;
  /**
   * Set to true by the admin's kill switch.
   * Patient clients detect this and show the "Session ended" state.
   */
  sessionEnded?: boolean;
}

type Listener = (snapshot: SimulationSnapshot, latest?: SimEvent) => void;

const defaultConfig: SimulationConfig = {
  arrivalRate: 6,
  doctorCount: 5,
  icuBedCount: 8,
  ambulanceCount: 4,
  speed: 1
};

const emptyWaits = { CRITICAL: [], SERIOUS: [], MODERATE: [], MILD: [] } satisfies Record<Severity, number[]>;

export class SimulationEngine {
  private running = false;
  private tickCount = 0;
  private timer?: number;
  private config: SimulationConfig = { ...defaultConfig };
  private queue = new PriorityQueue<Patient>(patientComparator);
  private doctors: Doctor[] = createDoctors(defaultConfig.doctorCount);
  private icuBeds: ICUBed[] = createICUBeds(defaultConfig.icuBedCount);
  private ambulances: Ambulance[] = createAmbulances(defaultConfig.ambulanceCount);
  private log = new EventLog();
  private listeners = new Set<Listener>();
  private metrics: MetricsPoint[] = [];
  private waitTimes: Record<Severity, number[]> = structuredClone(emptyWaits);
  private stats = { totalArrived: 0, treated: 0, escalated: 0, peakLoadTick: 0 };

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.schedule();
    this.emit();
  }

  pause() {
    this.running = false;
    if (this.timer) window.clearInterval(this.timer);
    this.emit();
  }

  reset() {
    this.pause();
    this.tickCount = 0;
    this.queue.clear();
    this.doctors = createDoctors(this.config.doctorCount);
    this.icuBeds = createICUBeds(this.config.icuBedCount);
    this.ambulances = createAmbulances(this.config.ambulanceCount);
    this.log.clear();
    this.metrics = [];
    this.waitTimes = structuredClone(emptyWaits);
    this.stats = { totalArrived: 0, treated: 0, escalated: 0, peakLoadTick: 0 };
    this.emit();
  }

  setSpeed(speed: number) {
    this.config.speed = speed;
    if (this.running) this.schedule();
    this.emit();
  }

  updateConfig(config: Partial<Omit<SimulationConfig, "speed">>) {
    this.config = { ...this.config, ...config };
    if (config.doctorCount !== undefined) this.resizeDoctors(config.doctorCount);
    if (config.icuBedCount !== undefined) this.resizeICU(config.icuBedCount);
    if (config.ambulanceCount !== undefined) this.resizeAmbulances(config.ambulanceCount);
    this.emit();
  }

  applyScenario(name: "normal" | "mass-casualty" | "night-shift") {
    const presets = {
      normal: { arrivalRate: 6, doctorCount: 5, icuBedCount: 8, ambulanceCount: 4 },
      "mass-casualty": { arrivalRate: 16, doctorCount: 7, icuBedCount: 9, ambulanceCount: 6 },
      "night-shift": { arrivalRate: 5, doctorCount: 3, icuBedCount: 6, ambulanceCount: 2 }
    };
    this.updateConfig(presets[name]);
  }

  // ─── ADMIN OVERRIDES ──────────────────────────────────────────────────────

  /**
   * Admin manually injects a patient with a specific severity.
   * Bypasses the Poisson arrival model — useful for live demos.
   */
  injectPatient(severity: Severity) {
    const patient = generatePatient(this.tickCount);
    // Override the randomly generated severity with the admin's choice
    const overridden: Patient = { ...patient, severity, originalSeverity: severity };
    this.addPatient(overridden);
    this.logEvent("patient-arrived", `[ADMIN] Manually injected ${overridden.name} (${severity}) for demo purposes.`, overridden);
  }

  /**
   * Admin manually sets a doctor's status.
   * Sets manualOverride=true so the engine won't auto-assign this doctor.
   * To release the override, set status back to "Idle" (manualOverride=false).
   */
  setDoctorStatus(doctorId: string, status: DoctorStatus) {
    this.doctors = this.doctors.map((doctor) => {
      if (doctor.id !== doctorId) return doctor;
      const isOverride = status === "On Break" || status === "In Surgery";
      return {
        ...doctor,
        status,
        manualOverride: isOverride,
        // If releasing override (back to Idle), clear the patient too
        patient: isOverride ? doctor.patient : undefined,
      };
    });
    this.emit();
  }

  /**
   * Admin toggles a bed's maintenance state.
   * Maintenance beds are shown distinctly in the UI and are skipped
   * when the engine tries to admit a new CRITICAL patient.
   */
  setICUBedMaintenance(bedId: string, maintenance: boolean) {
    this.icuBeds = this.icuBeds.map((bed) => {
      if (bed.id !== bedId) return bed;
      return { ...bed, maintenance, patient: maintenance ? undefined : bed.patient };
    });
    this.emit();
  }

  // ─── CORE LOOP ────────────────────────────────────────────────────────────

  tick() {
    this.tickCount += 1;
    this.createWalkIns();
    this.advanceAmbulances();
    this.escalateWaitingPatients();
    this.advanceICU();
    this.advanceDoctors();
    this.assignDoctors();
    this.recordMetrics();
    this.emit();
  }

  snapshot(): SimulationSnapshot {
    const averages = Object.fromEntries(
      (Object.keys(emptyWaits) as Severity[]).map((severity) => {
        const waits = this.waitTimes[severity];
        return [severity, waits.length ? Math.round(waits.reduce((sum, value) => sum + value, 0) / waits.length) : 0];
      })
    ) as Record<Severity, number>;

    const queue = this.queue.toArray();
    return {
      running: this.running,
      tick: this.tickCount,
      config: this.config,
      queue,
      doctors: this.doctors,
      icuBeds: this.icuBeds,
      ambulances: this.ambulances,
      events: this.log.all(),
      metrics: this.metrics,
      stats: { ...this.stats, averageWaitBySeverity: averages },
      capacityCrisis: this.isCapacityCrisis(queue)
    };
  }

  private schedule() {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => this.tick(), 1000 / this.config.speed);
  }

  private createWalkIns() {
    const lambdaPerTick = this.config.arrivalRate / 60;
    const arrivals = this.poisson(lambdaPerTick);
    for (let index = 0; index < arrivals; index += 1) this.addPatient(generatePatient(this.tickCount));
  }

  private addPatient(patient: Patient) {
    this.stats.totalArrived += 1;
    if (patient.severity === "CRITICAL") {
      // Look for a free bed that is NOT under maintenance
      const bed = this.icuBeds.find((item) => !item.patient && !item.maintenance);
      if (bed) {
        bed.patient = patient;
        bed.remainingTicks = icuDuration();
        this.logEvent("icu-admitted", `${patient.name} moved directly to ICU for ${patient.symptom}.`, patient);
        return;
      }
    }
    this.queue.enqueue(patient);
    this.logEvent("patient-arrived", `${patient.name}, ${patient.age}, arrived with ${patient.symptom}.`, patient);
  }

  private escalateWaitingPatients() {
    const escalated = this.queue.toArray().map((patient) => {
      const wait = this.tickCount - patient.arrivalTick;
      const threshold = patient.severity === "SERIOUS" ? 36 : patient.severity === "MODERATE" ? 48 : 64;
      if (patient.severity !== "CRITICAL" && wait >= threshold && wait % threshold === 0) {
        const updated = escalatePatient(patient, this.tickCount);
        this.stats.escalated += 1;
        this.logEvent("patient-escalated", `${patient.name} escalated to ${updated.severity} after waiting ${wait}s.`, updated);
        return updated;
      }
      return patient;
    });
    this.queue.rebuild(escalated);
  }

  private advanceDoctors() {
    this.doctors = this.doctors.map((doctor) => {
      // Skip doctors with manual override — admin controls their state
      if (doctor.manualOverride) return doctor;
      if (doctor.status === "Idle") return doctor;
      const remainingTicks = doctor.remainingTicks - 1;
      if (remainingTicks > 0) return { ...doctor, remainingTicks };
      if (doctor.patient) {
        this.stats.treated += 1;
        this.waitTimes[doctor.patient.severity].push((doctor.startedAt ?? this.tickCount) - doctor.patient.arrivalTick);
        this.logEvent("doctor-finished", `${doctor.name} finished treating ${doctor.patient.name}.`, doctor.patient);
      }
      return { ...doctor, status: "Idle", patient: undefined, startedAt: undefined, treatmentTicks: 0, remainingTicks: 0, treatedCount: doctor.treatedCount + 1 };
    });
  }

  private assignDoctors() {
    this.doctors = this.doctors.map((doctor) => {
      // Skip: not idle, or admin has manually overridden this doctor
      if (doctor.status !== "Idle" || doctor.manualOverride) return doctor;
      const patient = this.queue.dequeue();
      if (!patient) return doctor;
      const ticks = treatmentDuration(patient);
      this.logEvent("doctor-started", `${doctor.name} pulled ${patient.name} from the priority queue.`, patient);
      return { ...doctor, status: "Treating", patient, startedAt: this.tickCount, treatmentTicks: ticks, remainingTicks: ticks };
    });
  }

  private advanceICU() {
    this.icuBeds = this.icuBeds.map((bed) => {
      if (!bed.patient || bed.maintenance) return bed;
      const remainingTicks = bed.remainingTicks - 1;
      if (remainingTicks > 0) return { ...bed, remainingTicks };
      this.logEvent("icu-released", `${bed.patient.name} was stabilized and released from ICU.`, bed.patient);
      return { ...bed, patient: undefined, remainingTicks: 0 };
    });
  }

  private advanceAmbulances() {
    this.ambulances = this.ambulances.map((ambulance) => {
      if (ambulance.status === "Idle") {
        if (Math.random() < 0.018 * this.config.arrivalRate) {
          const totalTicks = 16 + Math.floor(Math.random() * 18);
          this.logEvent("ambulance-dispatched", `${ambulance.id} dispatched to an emergency call.`);
          return { ...ambulance, status: "Dispatched", remainingTicks: totalTicks, totalTicks, progress: 0 };
        }
        return ambulance;
      }

      const remainingTicks = ambulance.remainingTicks - 1;
      const progress = 1 - Math.max(remainingTicks, 0) / ambulance.totalTicks;
      if (remainingTicks > 0) return { ...ambulance, status: progress > 0.22 ? "En Route" : "Dispatched", remainingTicks, progress };

      if (ambulance.status === "Returning") return { ...ambulance, status: "Idle", progress: 0, remainingTicks: 0, totalTicks: 0 };

      const patient = generatePatient(this.tickCount, "Ambulance");
      this.addPatient(patient);
      this.logEvent("ambulance-arrived", `${ambulance.id} arrived with ${patient.name}.`, patient);
      return { ...ambulance, status: "Returning", remainingTicks: 10, totalTicks: 10, progress: 0 };
    });
  }

  private recordMetrics() {
    const doctorUtilization = this.doctors.filter((doctor) => doctor.status === "Treating").length / Math.max(1, this.doctors.length);
    const icuUtilization = this.icuBeds.filter((bed) => bed.patient).length / Math.max(1, this.icuBeds.length);
    const queueLength = this.queue.size;
    if (!this.metrics.length || queueLength > Math.max(...this.metrics.map((point) => point.queueLength))) this.stats.peakLoadTick = this.tickCount;
    this.metrics = [...this.metrics, { tick: this.tickCount, queueLength, doctorUtilization, icuUtilization }].slice(-120);
    if (this.isCapacityCrisis(this.queue.toArray())) this.logEvent("crisis", "Capacity crisis: CRITICAL patients are waiting while ICU is full.");
  }

  private isCapacityCrisis(queue: Patient[]) {
    // Crisis if ICU is full (no non-maintenance beds free) and a critical patient is waiting
    const availableBeds = this.icuBeds.filter((bed) => !bed.patient && !bed.maintenance);
    return availableBeds.length === 0 && queue.some((patient) => patient.severity === "CRITICAL" && this.tickCount - patient.arrivalTick > 24);
  }

  private resizeDoctors(count: number) {
    const existing = this.doctors.slice(0, count);
    const extra = count > existing.length ? createDoctors(count).slice(existing.length) : [];
    this.doctors = [...existing, ...extra];
  }

  private resizeICU(count: number) {
    const existing = this.icuBeds.slice(0, count);
    const extra = count > existing.length ? createICUBeds(count).slice(existing.length) : [];
    this.icuBeds = [...existing, ...extra];
  }

  private resizeAmbulances(count: number) {
    const existing = this.ambulances.slice(0, count);
    const extra = count > existing.length ? createAmbulances(count).slice(existing.length) : [];
    this.ambulances = [...existing, ...extra];
  }

  private poisson(lambda: number) {
    const limit = Math.exp(-lambda);
    let product = 1;
    let count = 0;
    do {
      count += 1;
      product *= Math.random();
    } while (product > limit);
    return count - 1;
  }

  private logEvent(type: SimEvent["type"], message: string, patient?: Patient) {
    const event = this.log.add({ tick: this.tickCount, type, message, patient, severity: patient?.severity });
    this.emit(event);
  }

  private emit(latest?: SimEvent) {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot, latest));
  }
}

export const simulationEngine = new SimulationEngine();
