import { Ambulance as AmbulanceIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimulationStore } from "@/store/useSimulationStore";

export function AmbulancePanel() {
  const { ambulances, config } = useSimulationStore();
  const speed = config.speed;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ambulance Fleet</CardTitle>
        <AmbulanceIcon className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="space-y-3">
        {ambulances.map((ambulance) => {
          const isIdle = ambulance.status === "Idle";
          const isEnRoute = ambulance.status === "En Route";
          
          return (
            <div key={ambulance.id} className="rounded-xl border border-line/60 bg-elevated/20 p-4 transition-colors hover:bg-elevated/30">
              <div className="flex justify-between items-center text-sm">
                <strong className="font-mono text-ink text-xs font-bold tracking-tight">{ambulance.id}</strong>
                <span 
                  className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                    isIdle 
                      ? "bg-muted/10 text-muted/60" 
                      : isEnRoute 
                        ? "bg-accent/10 text-accent" 
                        : "bg-muted/20 text-muted"
                  }`}
                >
                  {ambulance.status}
                </span>
              </div>
              
              {/* Sleek horizontal progress/route bar */}
              <div className="relative mt-4 h-1 rounded-full bg-command/80 overflow-visible">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  animate={{ width: `${Math.round(ambulance.progress * 100)}%` }}
                  transition={{ ease: "linear", duration: 1 / speed }}
                />
                
                {/* Glowing target tracking dot */}
                {!isIdle && (
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -ml-1 h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(45,212,191,0.8)]"
                    animate={{ left: `${Math.round(ambulance.progress * 100)}%` }}
                    transition={{ ease: "linear", duration: 1 / speed }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
