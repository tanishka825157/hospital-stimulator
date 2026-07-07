import { create } from "zustand";
import { simulationEngine, type SimulationSnapshot } from "@/engine/SimulationEngine";
import type { SimEvent } from "@/engine/events";

interface SimulationStore extends SimulationSnapshot {
  learnMode: boolean;
  selectedView: "Dashboard" | "Queue" | "Doctors" | "ICU" | "Ambulances" | "Reports" | "Learn";
  narration: SimEvent[];
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
    actions: {
      start: () => simulationEngine.start(),
      pause: () => simulationEngine.pause(),
      reset: () => {
        persistSnapshot(get(), "reset");
        simulationEngine.reset();
        set({ narration: [] });
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
      }
    }
  };
});

simulationEngine.subscribe((snapshot, latest) => {
  useSimulationStore.setState((state) => ({
    ...snapshot,
    narration: latest && state.learnMode ? [latest, ...state.narration].slice(0, 12) : state.narration
  }));
  if (snapshot.tick % 15 === 0) persistSnapshot(snapshot, "current");
});
