import { useState } from "react";
import { Shuffle, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/store/useSimulationStore";
import type { DoctorStatus } from "@/engine/Doctor";

const statuses: Array<Exclude<DoctorStatus, "Treating">> = ["Idle", "On Break", "In Surgery"];
const names = ["Dr. Aisha Menon", "Dr. Karan Iyer", "Dr. Elena Park", "Dr. Sameer Rao", "Dr. Mira Thomas", "Dr. Omar Rahman"];

function randomDoctor() {
  return {
    name: names[Math.floor(Math.random() * names.length)],
    status: "Idle" as Exclude<DoctorStatus, "Treating">,
  };
}

const statusLabel: Record<Exclude<DoctorStatus, "Treating">, string> = {
  Idle: "Available",
  "On Break": "On Break",
  "In Surgery": "In Surgery",
};

export function ManualDoctorAdd() {
  const { actions } = useSimulationStore();
  const [form, setForm] = useState(randomDoctor);
  const [flash, setFlash] = useState(false);

  const addDoctor = () => {
    actions.addDoctor({ name: form.name, status: form.status });
    setFlash(true);
    setForm(randomDoctor());
    setTimeout(() => setFlash(false), 600);
  };

  return (
    <div className={`rounded-xl border bg-panel/80 p-4 transition-all duration-300 ${flash ? "border-accent/60 shadow-[0_0_16px_rgba(125,211,252,0.14)]" : "border-line"}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Add Doctor</p>
        <button className="rounded p-1 text-muted hover:bg-elevated hover:text-ink" title="Randomize doctor" onClick={() => setForm(randomDoctor())}>
          <Shuffle className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mb-3 space-y-2">
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          className="h-8 w-full rounded-lg border border-line bg-command/60 px-2 text-xs text-ink outline-none focus:border-accent/60"
          placeholder="Doctor name"
        />
        <select
          value={form.status}
          onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Exclude<DoctorStatus, "Treating"> }))}
          className="h-8 w-full rounded-lg border border-line bg-command/60 px-2 text-xs font-semibold text-ink outline-none focus:border-accent/60"
          title="Initial doctor status"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>{statusLabel[status]}</option>
          ))}
        </select>
      </div>
      <Button
        className="w-full"
        size="sm"
        onClick={addDoctor}
        disabled={!form.name.trim()}
        title="Add doctor to the live roster"
      >
        <UserRoundPlus className="h-3.5 w-3.5" />
        Add Doctor
      </Button>
    </div>
  );
}
