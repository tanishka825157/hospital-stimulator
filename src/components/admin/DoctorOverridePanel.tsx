/**
 * DoctorOverridePanel — Admin-only doctor status controls.
 * Doctors stay idle until the admin assigns a patient from the queue.
 * Moving a treating doctor away from "Treating" returns the patient to the queue.
 */
import { motion } from "framer-motion";
import { Circle, Stethoscope, UserCheck, UserRoundPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/store/useSimulationStore";
import type { DoctorStatus } from "@/engine/Doctor";

const statusOptions: DoctorStatus[] = ["Idle", "Treating", "On Break", "In Surgery"];

const statusColor: Record<DoctorStatus, string> = {
  Idle: "text-mild",
  Treating: "text-accent",
  "On Break": "text-moderate",
  "In Surgery": "text-serious",
};

export function DoctorOverridePanel() {
  const { doctors, config, actions } = useSimulationStore();
  const speed = config.speed;
  const available = doctors.filter((doctor) => doctor.status === "Idle").length;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Doctors</CardTitle>
          <span className="text-xs text-muted">{available} available for patient assignment</span>
        </div>
        <Stethoscope className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {doctors.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line/60 bg-panel/30 px-8 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <UserRoundPlus className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">No doctors added</p>
              <p className="mx-auto max-w-[260px] text-xs leading-relaxed text-muted">
                Use Add Doctor in the sidebar to build the live roster and decide who is available.
              </p>
            </div>
          </div>
        )}
        {doctors.map((doctor) => {
          const progress = doctor.treatmentTicks ? 1 - doctor.remainingTicks / doctor.treatmentTicks : 0;
          const active = doctor.status === "Treating";
          const available = doctor.status === "Idle";

          return (
            <motion.div
              layout
              key={doctor.id}
              className={`rounded-xl border px-4 py-4 transition-all duration-300 ${
                active
                  ? "border-accent bg-elevated/40 shadow-[0_0_12px_rgba(125,211,252,0.08)] text-ink"
                  : available
                    ? "border-mild/35 bg-mild/5 text-ink"
                  : doctor.manualOverride
                    ? "border-serious/40 bg-serious/5 text-ink"
                    : "border-line/40 bg-panel/30 text-muted opacity-75"
              }`}
            >
              <div className="flex items-center justify-between text-sm mb-3">
                <strong className="flex items-center gap-2 font-semibold">
                  <Circle className={`h-2.5 w-2.5 ${active ? "fill-accent text-accent animate-pulse" : available ? "fill-mild text-mild" : doctor.manualOverride ? "fill-serious/60 text-serious/60" : "fill-muted/30 text-muted/30"}`} />
                  <span className={active || available ? "text-ink" : "text-muted"}>{doctor.name}</span>
                </strong>
                <span className={`rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${statusColor[doctor.status]} border-current/20 bg-current/5`}>
                  {available ? "Available" : doctor.status}
                </span>
              </div>

              {/* Status selector — admin can override */}
              <select
                value={doctor.status}
                onChange={(e) => actions.setDoctorStatus(doctor.id, e.target.value as DoctorStatus)}
                className={`w-full rounded-lg border border-line/60 bg-command/60 px-2 py-1.5 text-[11px] font-semibold outline-none transition-all cursor-pointer mb-3 ${statusColor[doctor.status]}`}
              >
                {statusOptions.filter((s) => s !== "Treating" || doctor.patient).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <div className="mt-1">
                {active && doctor.patient ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-ink/90 flex items-center gap-1.5 truncate">
                      <UserCheck className="h-3 w-3 text-accent shrink-0" />
                      {doctor.patient.name}
                    </p>
                    <p className="text-[11px] text-muted truncate capitalize pl-4">{doctor.patient.symptom}</p>
                    <Button size="sm" variant="secondary" className="mt-2 h-7 w-full text-[10px]" onClick={() => actions.dischargePatient(doctor.patient!.id)}>
                      Discharge / Complete
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs font-medium italic text-muted/40 h-8 flex items-center">
                    {doctor.manualOverride ? `Manually set to ${doctor.status}` : "Ready for next case"}
                  </p>
                )}
              </div>

              <div className="mt-4 h-1.5 rounded-full bg-command/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  animate={{ width: active ? `${Math.round(progress * 100)}%` : "0%" }}
                  transition={{ ease: "linear", duration: 1 / speed }}
                />
              </div>

              <div className="mt-3 flex justify-between font-mono text-[10px] text-muted/50 leading-none">
                <span className="font-semibold">{doctor.treatedCount} treated</span>
                {active && <span className="font-semibold">{doctor.remainingTicks}s remaining</span>}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
