import { Bed, Siren } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { severityColor } from "@/engine/Patient";
import { useSimulationStore } from "@/store/useSimulationStore";

export function ICUPanel() {
  const { icuBeds, capacityCrisis } = useSimulationStore();
  
  return (
    <Card className={capacityCrisis ? "border-critical/50 shadow-[0_0_12px_rgba(239,68,68,0.05)]" : ""}>
      <CardHeader>
        <CardTitle>ICU Capacity</CardTitle>
        {capacityCrisis ? (
          <Siren className="h-4 w-4 text-critical animate-bounce" />
        ) : (
          <Bed className="h-4 w-4 text-accent" />
        )}
      </CardHeader>
      
      {capacityCrisis && (
        <div className="crisis-pulse border-b border-critical/20 bg-critical/5 px-6 py-2.5 text-xs font-semibold text-critical flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-critical shrink-0 animate-ping" />
          Capacity Crisis: CRITICAL patient waiting while ICU is full.
        </div>
      )}
      
      <CardContent className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-3">
        {icuBeds.map((bed) => {
          const patient = bed.patient;
          const severity = patient?.severity;
          const occupied = !!patient;
          
          return (
            <motion.div
              layout
              key={bed.id}
              className={`aspect-square rounded-xl border flex flex-col justify-between p-2.5 transition-all duration-300 ${
                occupied
                  ? "shadow-sm"
                  : "border-line bg-transparent hover:border-accent/30 hover:bg-elevated/10"
              }`}
              style={{
                borderColor: severity ? `${severityColor[severity]}40` : "",
                backgroundColor: severity ? `${severityColor[severity]}12` : ""
              }}
            >
              {/* Top Row: ID & Icon */}
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted/60 leading-none">
                <span>{bed.id}</span>
                <Bed className={`h-3 w-3 ${occupied ? "" : "opacity-30"}`} style={{ color: severity ? severityColor[severity] : "inherit" }} />
              </div>

              {/* Patient Initials */}
              <div className="text-center my-1.5">
                <p 
                  className={`font-mono text-base font-extrabold tracking-tight leading-none ${
                    occupied ? "text-ink" : "text-muted/20"
                  }`}
                  style={{ color: severity ? severityColor[severity] : "" }}
                >
                  {patient ? initials(patient.name) : "--"}
                </p>
              </div>

              {/* Time Remaining / Status */}
              <div className="text-center leading-none">
                <span className="font-mono text-[9px] font-bold text-muted/50 uppercase tracking-wider leading-none">
                  {patient ? `${bed.remainingTicks}s` : "Open"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
