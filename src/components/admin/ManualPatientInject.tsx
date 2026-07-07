/**
 * ManualPatientInject — Admin-only control.
 * Lets the admin manually add a patient with a specific severity,
 * bypassing the Poisson arrival model. Useful for live demos and stress tests.
 */
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/store/useSimulationStore";
import type { Severity } from "@/engine/Patient";
import { severityColor } from "@/engine/Patient";

const severities: Severity[] = ["CRITICAL", "SERIOUS", "MODERATE", "MILD"];

export function ManualPatientInject() {
  const { actions, running } = useSimulationStore();
  const [selected, setSelected] = useState<Severity>("SERIOUS");
  const [flash, setFlash] = useState(false);

  const inject = () => {
    if (!running) return;
    actions.injectPatient(selected);
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

  return (
    <div className={`rounded-xl border bg-panel/80 p-4 transition-all duration-300 ${flash ? "border-accent/60 shadow-[0_0_16px_rgba(45,212,191,0.15)]" : "border-line"}`}>
      <p className="mb-3 text-[10px] uppercase tracking-widest font-bold text-muted">Manual Inject</p>
      <div className="flex gap-1.5 mb-3">
        {severities.map((sev) => (
          <button
            key={sev}
            onClick={() => setSelected(sev)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider border transition-all ${
              selected === sev ? "text-command scale-[1.02]" : "text-muted/60 border-line/40 bg-transparent hover:opacity-80"
            }`}
            style={selected === sev ? { backgroundColor: severityColor[sev], borderColor: severityColor[sev] } : {}}
          >
            {sev.slice(0, 3)}
          </button>
        ))}
      </div>
      <Button
        className="w-full"
        size="sm"
        onClick={inject}
        disabled={!running}
        title={running ? `Inject a ${selected} patient` : "Start simulation first"}
      >
        <UserPlus className="h-3.5 w-3.5" />
        Add Patient
      </Button>
      {!running && (
        <p className="mt-2 text-center text-[10px] text-muted/60">Start simulation to inject</p>
      )}
    </div>
  );
}
