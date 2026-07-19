import { motion } from "framer-motion";
import { Circle, Stethoscope, UserCheck, UserRoundPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimulationStore } from "@/store/useSimulationStore";

export function DoctorPanel() {
  const { doctors, config } = useSimulationStore();
  const speed = config.speed;
  const available = doctors.filter((doctor) => doctor.status === "Idle").length;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Doctors</CardTitle>
          <span className="text-xs text-muted">{available} available now</span>
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
              <p className="text-sm font-semibold text-ink">No doctor roster yet</p>
              <p className="mx-auto max-w-[260px] text-xs leading-relaxed text-muted">
                Waiting for the admin to add doctors and publish availability.
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
                    : "border-line/40 bg-panel/30 text-muted opacity-75"
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <strong className="flex items-center gap-2 font-semibold">
                  <Circle className={`h-2.5 w-2.5 ${active ? "fill-accent text-accent animate-pulse" : available ? "fill-mild text-mild" : "fill-muted/30 text-muted/30"}`} />
                  <span className={active || available ? "text-ink" : "text-muted"}>{doctor.name}</span>
                </strong>
                <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  active ? "border-accent/20 bg-accent/5 text-accent" : available ? "border-mild/25 bg-mild/5 text-mild" : "border-line bg-elevated/40 text-muted"
                }`}>
                  {available ? "Available" : doctor.status}
                </span>
              </div>
              
              <div className="mt-3">
                {active && doctor.patient ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-ink/90 flex items-center gap-1.5 truncate">
                      <UserCheck className="h-3 w-3 text-accent shrink-0" />
                      {doctor.patient.name}
                    </p>
                    <p className="text-[11px] text-muted truncate capitalize pl-4.5">{doctor.patient.symptom}</p>
                  </div>
                ) : (
                  <p className="text-xs font-medium italic text-muted/40 h-8 flex items-center">
                    {available ? "Available for next patient" : "Currently unavailable"}
                  </p>
                )}
              </div>

              {/* Progress Bar Container */}
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
