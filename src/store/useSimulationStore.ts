import { create } from "zustand";
import { simulationEngine, type BedStatus, type PatientInput, type SimulationSnapshot } from "@/engine/SimulationEngine";
import type { Severity } from "@/engine/Patient";
import type { DoctorInput, DoctorStatus } from "@/engine/Doctor";

interface SimulationStore extends SimulationSnapshot {
  selectedView: "Dashboard" | "Queue" | "Doctors" | "ICU" | "Ambulances" | "Reports";
  /** Number of patient sessions currently watching (populated by the sync layer) */
  viewerCount: number;
  /** True when the patient view receives a sessionEnded flag from admin */
  sessionEnded: boolean;
  actions: {
    start: () => void;
    pause: () => void;
    reset: () => void;
    setSpeed: (speed: number) => void;
    updateConfig: (config: Parameters<typeof simulationEngine.updateConfig>[0]) => void;
    applyScenario: (scenario: "normal" | "mass-casualty" | "night-shift") => void;
    setSelectedView: (view: SimulationStore["selectedView"]) => void;
    downloadReport: () => void;
    addPatient: (input: PatientInput) => void;
    addDoctor: (input: DoctorInput) => void;
    assignPatientToDoctor: (patientId: string, doctorId: string) => void;
    assignPatientToBed: (patientId: string, bedId: string) => void;
    setDoctorStatus: (doctorId: string, status: DoctorStatus) => void;
    setBedStatus: (bedId: string, status: BedStatus) => void;
    dispatchAmbulance: (ambulanceId: string, destination?: string) => void;
    confirmAmbulanceArrival: (ambulanceId: string) => void;
    returnAmbulanceToIdle: (ambulanceId: string) => void;
    dischargePatient: (patientId: string) => void;
    overrideSeverity: (patientId: string, severity: Severity) => void;
    setViewerCount: (count: number) => void;
    /**
     * Called by the patient-side sync layer to apply an incoming snapshot
     * without triggering the local engine. The engine is Admin-only; patients
     * just render whatever the admin pushes.
     */
    hydrate: (snapshot: SimulationSnapshot) => void;
    /** Admin kill switch — marks session as ended and pushes to Supabase */
    endSession: () => void;
  };
}

const initial = simulationEngine.snapshot();

function persistSnapshot(snapshot: SimulationSnapshot, reason: "current" | "reset" | "download") {
  try {
    const compact = {
      reason,
      savedAt: new Date().toISOString(),
      tick: snapshot.tick,
      config: snapshot.config,
      stats: snapshot.stats,
      queueLength: snapshot.queue.length,
      doctorUtilization: snapshot.metrics.at(-1)?.doctorUtilization ?? 0,
      icuUtilization: snapshot.metrics.at(-1)?.icuUtilization ?? 0,
      events: snapshot.events.slice(0, 20)
    };
    localStorage.setItem("hospital-sim-current", JSON.stringify(compact));
    if (reason !== "current") {
      const history = JSON.parse(localStorage.getItem("hospital-sim-history") ?? "[]") as unknown[];
      localStorage.setItem("hospital-sim-history", JSON.stringify([compact, ...history].slice(0, 12)));
    }
  } catch {
    // Persistence should never interrupt the simulation loop.
  }
}

export const useSimulationStore = create<SimulationStore>((set, get) => {
  return {
    ...initial,
    selectedView: "Dashboard",
    viewerCount: 0,
    sessionEnded: false,

    actions: {
      start: () => simulationEngine.start(),
      pause: () => simulationEngine.pause(),
      reset: () => {
        persistSnapshot(get(), "reset");
        simulationEngine.reset();
        set({ sessionEnded: false });
      },
      setSpeed: (speed) => simulationEngine.setSpeed(speed),
      updateConfig: (config) => simulationEngine.updateConfig(config),
      applyScenario: (scenario) => simulationEngine.applyScenario(scenario),
      setSelectedView: (selectedView) => set({ selectedView }),
      downloadReport: () => {
        const snapshot = get();
        persistSnapshot(snapshot, "download");
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `hospital-sim-report-t${snapshot.tick}.json`;
        link.click();
        URL.revokeObjectURL(url);
      },

      // ─── ADMIN-CONTROLLED WORKFLOW ───────────────────────────────────────
      addPatient: (input) => simulationEngine.addPatient(input),
      addDoctor: (input) => simulationEngine.addDoctor(input),
      assignPatientToDoctor: (patientId, doctorId) => simulationEngine.assignPatientToDoctor(patientId, doctorId),
      assignPatientToBed: (patientId, bedId) => simulationEngine.assignPatientToBed(patientId, bedId),
      setDoctorStatus: (doctorId, status) => simulationEngine.setDoctorStatus(doctorId, status),
      setBedStatus: (bedId, status) => simulationEngine.setBedStatus(bedId, status),
      dispatchAmbulance: (ambulanceId, destination) => simulationEngine.dispatchAmbulance(ambulanceId, destination),
      confirmAmbulanceArrival: (ambulanceId) => simulationEngine.confirmAmbulanceArrival(ambulanceId),
      returnAmbulanceToIdle: (ambulanceId) => simulationEngine.returnAmbulanceToIdle(ambulanceId),
      dischargePatient: (patientId) => simulationEngine.dischargePatient(patientId),
      overrideSeverity: (patientId, severity) => simulationEngine.overrideSeverity(patientId, severity),
      setViewerCount: (viewerCount) => set({ viewerCount }),

      // ─── PATIENT HYDRATION ────────────────────────────────────────────────
      /**
       * Called ONLY on the patient side. Replaces simulation state with the
       * snapshot received from Supabase Realtime. Does NOT touch the local
       * SimulationEngine — patients are pure read-only consumers.
       */
      hydrate: (snapshot) => {
        set((state) => ({
          ...snapshot,
          selectedView: state.selectedView,
          sessionEnded: snapshot.sessionEnded ?? false,
        }));
      },

      // ─── KILL SWITCH ──────────────────────────────────────────────────────
      endSession: () => {
        simulationEngine.pause();
        set({ sessionEnded: true });
        // The sync layer (useRealtimeSync) will detect sessionEnded=true
        // and push a final snapshot with sessionEnded=true to Supabase,
        // causing all patient clients to show the "Session ended" state.
      },
    },
  };
});

// Subscribe the store to engine ticks (admin side only)
simulationEngine.subscribe((snapshot) => {
  useSimulationStore.setState(() => ({
    ...snapshot
  }));
  if (snapshot.tick % 15 === 0) persistSnapshot(snapshot, "current");
});
