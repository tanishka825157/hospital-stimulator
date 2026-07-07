import { motion } from "framer-motion";
import { Circle, Stethoscope, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimulationStore } from "@/store/useSimulationStore";

export function DoctorPanel() {
  const { doctors, config } = useSimulationStore();
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
                  : "border-line/40 bg-panel/30 text-muted opacity-75"
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <strong className="flex items-center gap-2 font-semibold">
                  <Circle className={`h-2.5 w-2.5 ${active ? "fill-accent text-accent animate-pulse" : "fill-muted/30 text-muted/30"}`} />
                  <span className={active ? "text-ink" : "text-muted"}>{doctor.name}</span>
                </strong>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${active ? "text-accent" : "text-muted/60"}`}>
                  {doctor.status}
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
                    Ready for next case
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
