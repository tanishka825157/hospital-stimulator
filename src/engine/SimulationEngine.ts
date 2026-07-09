import { createAmbulances, type Ambulance } from "@/engine/Ambulance";
import { createDoctors, treatmentDuration, type Doctor, type DoctorStatus } from "@/engine/Doctor";
import { createICUBeds, icuDuration, type ICUBed } from "@/engine/ICU";
import { generatePatient, patientComparator, escalatePatient, type Patient, type Severity } from "@/engine/Patient";
import { EventLog, type SimEvent } from "@/engine/events";
import { PriorityQueue } from "@/engine/PriorityQueue";

export interface SimulationConfig {
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

export interface PatientInput {
  name?: string;
  age?: number;
  symptom?: string;
  severity: Severity;
  source?: Patient["source"];
}

export type BedStatus = "Empty" | "Occupied" | "Under Maintenance";

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
      normal: { doctorCount: 5, icuBedCount: 8, ambulanceCount: 4 },
      "mass-casualty": { doctorCount: 7, icuBedCount: 9, ambulanceCount: 6 },
      "night-shift": { doctorCount: 3, icuBedCount: 6, ambulanceCount: 2 }
    };
    this.updateConfig(presets[name]);
  }

  // ─── ADMIN-CONTROLLED WORKFLOW ────────────────────────────────────────────

  /**
   * Admin manually adds a patient to the queue. No patient enters the system
   * unless the admin takes this action or confirms an ambulance arrival.
   */
  addPatient(input: PatientInput) {
    const generated = generatePatient(this.tickCount, input.source ?? "Walk-in");
    const patient: Patient = {
      ...generated,
      id: `P-${this.tickCount}-${Math.random().toString(16).slice(2, 8)}`,
      name: input.name?.trim() || generated.name,
      age: input.age && input.age > 0 ? input.age : generated.age,
      symptom: input.symptom?.trim() || generated.symptom,
      severity: input.severity,
      originalSeverity: input.severity,
      source: input.source ?? "Walk-in",
      arrivalTick: this.tickCount
    };
    this.enqueuePatient(patient, `${patient.name}, ${patient.age}, arrived with ${patient.symptom}.`);
    this.emit();
    return patient;
  }

  assignPatientToDoctor(patientId: string, doctorId: string) {
    const doctor = this.doctors.find((item) => item.id === doctorId);
    if (!doctor || doctor.status !== "Idle") return;
    const patient = this.removePatientFromQueue(patientId);
    if (!patient) return;
    const ticks = treatmentDuration(patient);
    this.doctors = this.doctors.map((item) =>
      item.id === doctorId
        ? { ...item, status: "Treating", patient, startedAt: this.tickCount, treatmentTicks: ticks, remainingTicks: ticks, manualOverride: false }
        : item
    );
    this.logEvent("doctor-started", `${doctor.name} started treating ${patient.name}.`, patient);
    this.emit();
  }

  assignPatientToBed(patientId: string, bedId: string) {
    const bed = this.icuBeds.find((item) => item.id === bedId);
    if (!bed || bed.patient || bed.maintenance) return;
    const patient = this.removePatientFromQueue(patientId) ?? this.removePatientFromDoctor(patientId);
    if (!patient) return;
    const ticks = icuDuration();
    this.icuBeds = this.icuBeds.map((item) => item.id === bedId ? { ...item, patient, remainingTicks: ticks, maintenance: false } : item);
    this.logEvent("icu-admitted", `${patient.name} assigned to ${bed.id}.`, patient);
    this.emit();
  }

  /**
   * Admin manually sets a doctor's status.
   * If a doctor is moved away from Treating, their patient returns to the queue.
   */
  setDoctorStatus(doctorId: string, status: DoctorStatus) {
    let returnedPatient: Patient | undefined;
    const doctorName = this.doctors.find((doctor) => doctor.id === doctorId)?.name ?? doctorId;
    this.doctors = this.doctors.map((doctor) => {
      if (doctor.id !== doctorId) return doctor;
      if (doctor.patient && status !== "Treating") returnedPatient = doctor.patient;
      return {
        ...doctor,
        status,
        manualOverride: status === "On Break" || status === "In Surgery",
        patient: status === "Treating" ? doctor.patient : undefined,
        startedAt: status === "Treating" ? doctor.startedAt : undefined,
        treatmentTicks: status === "Treating" ? doctor.treatmentTicks : 0,
        remainingTicks: status === "Treating" ? doctor.remainingTicks : 0,
      };
    });
    if (returnedPatient) this.queue.enqueue({ ...returnedPatient, arrivalTick: this.tickCount });
    this.logEvent("doctor-status", `${doctorName} marked ${status}.`, returnedPatient);
    this.emit();
  }

  /**
   * Admin manually marks a bed empty, occupied, or under maintenance.
   * Emptying/maintaining an occupied bed returns that patient to the queue.
   */
  setBedStatus(bedId: string, status: BedStatus) {
    let returnedPatient: Patient | undefined;
    this.icuBeds = this.icuBeds.map((bed) => {
      if (bed.id !== bedId) return bed;
      if (bed.patient && status !== "Occupied") returnedPatient = bed.patient;
      return {
        ...bed,
        maintenance: status === "Under Maintenance",
        patient: status === "Occupied" ? bed.patient : undefined,
        remainingTicks: status === "Occupied" ? bed.remainingTicks : 0
      };
    });
    if (returnedPatient) this.queue.enqueue({ ...returnedPatient, arrivalTick: this.tickCount });
    this.logEvent("bed-status", `${bedId} marked ${status}.`, returnedPatient);
    this.emit();
  }

  dispatchAmbulance(ambulanceId: string, destination = "emergency call") {
    const ambulance = this.ambulances.find((item) => item.id === ambulanceId);
    if (!ambulance || ambulance.status !== "Idle") return;
    const totalTicks = 16 + Math.floor(Math.random() * 18);
    this.ambulances = this.ambulances.map((item) =>
      item.id === ambulanceId ? { ...item, status: "Dispatched", remainingTicks: totalTicks, totalTicks, progress: 0 } : item
    );
    this.logEvent("ambulance-dispatched", `${ambulanceId} dispatched to ${destination}.`);
    this.emit();
  }

  confirmAmbulanceArrival(ambulanceId: string) {
    const ambulance = this.ambulances.find((item) => item.id === ambulanceId);
    if (!ambulance || ambulance.status === "Idle") return;
    const generated = generatePatient(this.tickCount, "Ambulance");
    const patient: Patient = { ...generated, arrivalTick: this.tickCount };
    this.enqueuePatient(patient, `${ambulanceId} arrived with ${patient.name}.`);
    this.ambulances = this.ambulances.map((item) =>
      item.id === ambulanceId ? { ...item, status: "Returning", remainingTicks: 10, totalTicks: 10, progress: 0 } : item
    );
    this.logEvent("ambulance-arrived", `${ambulanceId} arrival confirmed with ${patient.name}.`, patient);
    this.emit();
  }

  returnAmbulanceToIdle(ambulanceId: string) {
    const ambulance = this.ambulances.find((item) => item.id === ambulanceId);
    if (!ambulance || ambulance.status !== "Returning") return;
    this.ambulances = this.ambulances.map((item) =>
      item.id === ambulanceId ? { ...item, status: "Idle", remainingTicks: 0, totalTicks: 0, progress: 0 } : item
    );
    this.logEvent("ambulance-returned", `${ambulanceId} returned to idle.`);
    this.emit();
  }

  dischargePatient(patientId: string) {
    let patient: Patient | undefined;
    let location = "";

    this.doctors = this.doctors.map((doctor) => {
      if (doctor.patient?.id !== patientId) return doctor;
      patient = doctor.patient;
      location = doctor.name;
      return { ...doctor, status: "Idle", patient: undefined, startedAt: undefined, treatmentTicks: 0, remainingTicks: 0, treatedCount: doctor.treatedCount + 1 };
    });

    if (!patient) {
      this.icuBeds = this.icuBeds.map((bed) => {
        if (bed.patient?.id !== patientId) return bed;
        patient = bed.patient;
        location = bed.id;
        return { ...bed, patient: undefined, remainingTicks: 0 };
      });
    }

    if (!patient) return;
    this.stats.treated += 1;
    this.waitTimes[patient.severity].push(this.tickCount - patient.arrivalTick);
    this.logEvent("patient-discharged", `${patient.name} discharged from ${location}.`, patient);
    this.emit();
  }

  overrideSeverity(patientId: string, newSeverity: Severity) {
    const update = (patient: Patient): Patient => ({ ...patient, severity: newSeverity });
    let patient: Patient | undefined;
    const queued = this.queue.remove((item) => item.id === patientId);
    if (queued) {
      patient = update(queued);
      this.queue.enqueue(patient);
    }

    this.doctors = this.doctors.map((doctor) => {
      if (doctor.patient?.id !== patientId) return doctor;
      patient = update(doctor.patient);
      return { ...doctor, patient };
    });

    this.icuBeds = this.icuBeds.map((bed) => {
      if (bed.patient?.id !== patientId) return bed;
      patient = update(bed.patient);
      return { ...bed, patient };
    });

    if (!patient) return;
    this.logEvent("severity-overridden", `${patient.name} severity manually set to ${newSeverity}.`, patient);
    this.emit();
  }

  // ─── CORE LOOP ────────────────────────────────────────────────────────────

  tick() {
    this.tickCount += 1;
    this.advanceAmbulances();
    this.escalateWaitingPatients();
    this.advanceICUTimers();
    this.advanceDoctors();
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

  private enqueuePatient(patient: Patient, message: string) {
    this.stats.totalArrived += 1;
    this.queue.enqueue(patient);
    this.logEvent("patient-arrived", message, patient);
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
      if (doctor.status !== "Treating") return doctor;
      const remainingTicks = doctor.remainingTicks - 1;
      return { ...doctor, remainingTicks: Math.max(0, remainingTicks) };
    });
  }

  private advanceICUTimers() {
    this.icuBeds = this.icuBeds.map((bed) => {
      if (!bed.patient || bed.maintenance) return bed;
      const remainingTicks = bed.remainingTicks - 1;
      return { ...bed, remainingTicks: Math.max(0, remainingTicks) };
    });
  }

  private advanceAmbulances() {
    this.ambulances = this.ambulances.map((ambulance) => {
      if (ambulance.status === "Idle") return ambulance;
      if (ambulance.status === "Returning") return ambulance;
      const remainingTicks = ambulance.remainingTicks - 1;
      const progress = 1 - Math.max(remainingTicks, 0) / ambulance.totalTicks;
      return { ...ambulance, status: progress > 0.22 ? "En Route" : "Dispatched", remainingTicks: Math.max(0, remainingTicks), progress: Math.min(1, progress) };
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

  private removePatientFromQueue(patientId: string) {
    return this.queue.remove((patient) => patient.id === patientId);
  }

  private removePatientFromDoctor(patientId: string) {
    let removed: Patient | undefined;
    this.doctors = this.doctors.map((doctor) => {
      if (doctor.patient?.id !== patientId) return doctor;
      removed = doctor.patient;
      return { ...doctor, status: "Idle", patient: undefined, startedAt: undefined, treatmentTicks: 0, remainingTicks: 0 };
    });
    return removed;
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
