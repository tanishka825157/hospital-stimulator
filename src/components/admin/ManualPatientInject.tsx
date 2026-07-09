/**
 * ManualPatientInject — Admin-only patient intake.
 * Every patient now starts here (or from a confirmed ambulance arrival);
 * the engine no longer creates walk-ins automatically.
 */
import { useState } from "react";
import { Shuffle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/store/useSimulationStore";
import type { Severity } from "@/engine/Patient";
import { severityColor } from "@/engine/Patient";

const severities: Severity[] = ["CRITICAL", "SERIOUS", "MODERATE", "MILD"];
const names = ["Amara Osei", "Priya Shah", "Noah Brooks", "Maya Chen", "Omar Khan", "Sofia Garcia"];
const symptoms = ["chest pain", "severe asthma attack", "compound fracture", "abdominal pain", "high fever", "minor burn"];

function randomForm() {
  return {
    name: names[Math.floor(Math.random() * names.length)],
    age: String(8 + Math.floor(Math.random() * 82)),
    symptom: symptoms[Math.floor(Math.random() * symptoms.length)]
  };
}

export function ManualPatientInject() {
  const { actions } = useSimulationStore();
  const [selected, setSelected] = useState<Severity>("SERIOUS");
  const [form, setForm] = useState(randomForm);
  const [flash, setFlash] = useState(false);

  const inject = () => {
    actions.addPatient({ name: form.name, age: Number(form.age), symptom: form.symptom, severity: selected });
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

  return (
    <div className={`rounded-xl border bg-panel/80 p-4 transition-all duration-300 ${flash ? "border-accent/60 shadow-[0_0_16px_rgba(45,212,191,0.15)]" : "border-line"}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Add Patient</p>
        <button className="rounded p-1 text-muted hover:bg-elevated hover:text-ink" title="Randomize fields" onClick={() => setForm(randomForm())}>
          <Shuffle className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mb-3 space-y-2">
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          className="h-8 w-full rounded-lg border border-line bg-command/60 px-2 text-xs text-ink outline-none focus:border-accent/60"
          placeholder="Patient name"
        />
        <div className="grid grid-cols-[64px,1fr] gap-2">
          <input
            value={form.age}
            onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
            className="h-8 rounded-lg border border-line bg-command/60 px-2 text-xs text-ink outline-none focus:border-accent/60"
            placeholder="Age"
            inputMode="numeric"
          />
          <input
            value={form.symptom}
            onChange={(event) => setForm((current) => ({ ...current, symptom: event.target.value }))}
            className="h-8 rounded-lg border border-line bg-command/60 px-2 text-xs text-ink outline-none focus:border-accent/60"
            placeholder="Symptom"
          />
        </div>
      </div>
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
        disabled={!form.name.trim() || !form.symptom.trim()}
        title={`Add a ${selected} patient`}
      >
        <UserPlus className="h-3.5 w-3.5" />
        Add Patient
      </Button>
    </div>
  );
}
