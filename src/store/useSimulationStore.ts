import { create } from "zustand";
import { simulationEngine, type SimulationSnapshot } from "@/engine/SimulationEngine";
import type { SimEvent } from "@/engine/events";
import type { Severity } from "@/engine/Patient";
import type { DoctorStatus } from "@/engine/Doctor";

interface SimulationStore extends SimulationSnapshot {
  learnMode: boolean;
  selectedView: "Dashboard" | "Queue" | "Doctors" | "ICU" | "Ambulances" | "Reports" | "Learn";
  narration: SimEvent[];
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
    setLearnMode: (enabled: boolean) => void;
    setSelectedView: (view: SimulationStore["selectedView"]) => void;
    downloadReport: () => void;
    // Admin override actions
    injectPatient: (severity: Severity) => void;
    setDoctorStatus: (doctorId: string, status: DoctorStatus) => void;
    setICUBedMaintenance: (bedId: string, maintenance: boolean) => void;
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
    learnMode: true,
    selectedView: "Dashboard",
    narration: [],
    viewerCount: 0,
    sessionEnded: false,

    actions: {
      start: () => simulationEngine.start(),
      pause: () => simulationEngine.pause(),
      reset: () => {
        persistSnapshot(get(), "reset");
        simulationEngine.reset();
        set({ narration: [], sessionEnded: false });
      },
      setSpeed: (speed) => simulationEngine.setSpeed(speed),
      updateConfig: (config) => simulationEngine.updateConfig(config),
      applyScenario: (scenario) => simulationEngine.applyScenario(scenario),
      setLearnMode: (learnMode) => set({ learnMode }),
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

      // ─── ADMIN OVERRIDES ─────────────────────────────────────────────────
      injectPatient: (severity) => simulationEngine.injectPatient(severity),
      setDoctorStatus: (doctorId, status) => simulationEngine.setDoctorStatus(doctorId, status),
      setICUBedMaintenance: (bedId, maintenance) => simulationEngine.setICUBedMaintenance(bedId, maintenance),
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
          learnMode: state.learnMode,
          selectedView: state.selectedView,
          sessionEnded: snapshot.sessionEnded ?? false,
          narration: state.learnMode && snapshot.events[0]
            ? [snapshot.events[0], ...state.narration].slice(0, 12)
            : state.narration,
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
simulationEngine.subscribe((snapshot, latest) => {
  useSimulationStore.setState((state) => ({
    ...snapshot,
    narration: latest && state.learnMode ? [latest, ...state.narration].slice(0, 12) : state.narration
  }));
  if (snapshot.tick % 15 === 0) persistSnapshot(snapshot, "current");
});
