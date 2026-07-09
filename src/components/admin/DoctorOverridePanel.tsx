/**
 * DoctorOverridePanel — Admin-only doctor status controls.
 * Doctors stay idle until the admin assigns a patient from the queue.
 * Moving a treating doctor away from "Treating" returns the patient to the queue.
 */
import { motion } from "framer-motion";
import { Circle, Stethoscope, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/store/useSimulationStore";
import type { DoctorStatus } from "@/engine/Doctor";

const statusOptions: DoctorStatus[] = ["Idle", "Treating", "On Break", "In Surgery"];

const statusColor: Record<DoctorStatus, string> = {
  Idle: "text-muted/60",
  Treating: "text-accent",
  "On Break": "text-moderate",
  "In Surgery": "text-serious",
};

export function DoctorOverridePanel() {
  const { doctors, config, actions } = useSimulationStore();
  const speed = config.speed;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doctors</CardTitle>
        <Stethoscope className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {doctors.map((doctor) => {
          const progress = doctor.treatmentTicks ? 1 - doctor.remainingTicks / doctor.treatmentTicks : 0;
          const active = doctor.status === "Treating";

          return (
            <motion.div
              layout
              key={doctor.id}
              className={`rounded-2xl border px-4 py-4 transition-all duration-300 ${
                active
                  ? "border-accent bg-elevated/40 shadow-[0_0_12px_rgba(45,212,191,0.05)] text-ink"
                  : doctor.manualOverride
                    ? "border-serious/40 bg-serious/5 text-ink"
                    : "border-line/40 bg-panel/30 text-muted opacity-75"
              }`}
            >
              <div className="flex items-center justify-between text-sm mb-3">
                <strong className="flex items-center gap-2 font-semibold">
                  <Circle className={`h-2.5 w-2.5 ${active ? "fill-accent text-accent animate-pulse" : doctor.manualOverride ? "fill-serious/60 text-serious/60" : "fill-muted/30 text-muted/30"}`} />
                  <span className={active ? "text-ink" : "text-muted"}>{doctor.name}</span>
                </strong>
                {doctor.manualOverride && (
                  <span className="text-[8px] uppercase tracking-wider font-bold text-serious/80 border border-serious/20 bg-serious/5 px-1.5 py-0.5 rounded">
                    Override
                  </span>
                )}
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
