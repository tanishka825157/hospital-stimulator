import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Play, Timer, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { severityColor } from "@/engine/Patient";
import { useSimulationStore } from "@/store/useSimulationStore";

export function QueuePanel() {
  const { queue, tick, running, actions } = useSimulationStore();
  
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Priority Queue</CardTitle>
          <span className="text-xs text-muted">Urgency first, arrival time second</span>
        </div>
        <span className="font-mono text-xs uppercase tracking-wider text-accent bg-accent/5 px-2.5 py-1 rounded-full border border-accent/10 font-bold">
          {queue.length} waiting
        </span>
      </CardHeader>
      <CardContent className="thin-scrollbar max-h-[520px] overflow-auto">
        {queue.length === 0 ? (
          tick === 0 ? (
            // Simulation not started state
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-line/60 px-8 py-12 text-center bg-panel/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent animate-pulse">
                <Activity className="h-6 w-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">Simulation paused</p>
                <p className="text-xs text-muted max-w-[200px] mx-auto">Press Start to begin hospital command center live operations</p>
              </div>
              <Button size="sm" onClick={actions.start} className="mt-2">
                <Play className="h-3.5 w-3.5" />
                Start Simulation
              </Button>
            </div>
          ) : (
            // Empty queue state
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line/40 px-8 py-10 text-center bg-panel/10">
              <p className="text-xs font-semibold text-muted/80">No patients waiting</p>
              <p className="text-[10px] text-muted/60">Queue is clear, all arrivals treated or admitted</p>
            </div>
          )
        ) : (
          <div className="space-y-2 pr-1">
            <AnimatePresence initial={false}>
              {queue.map((patient, index) => (
                <motion.div
                  layout
                  key={patient.id}
                  initial={{ opacity: 0, y: -24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 120, scale: 0.95 }}
                  transition={{ 
                    y: { type: "tween", ease: "easeOut", duration: 0.25 },
                    opacity: { type: "tween", ease: "easeOut", duration: 0.25 },
                    x: { type: "tween", ease: "easeInOut", duration: 0.3 },
                    scale: { type: "tween", ease: "easeInOut", duration: 0.3 },
                    layout: { type: "spring", stiffness: 300, damping: 30 } 
                  }}
                  className="rounded-xl border border-line bg-elevated/40 hover:bg-elevated/70 transition-colors px-4 py-3 flex items-center justify-between gap-4"
                  style={{ borderLeftColor: severityColor[patient.severity], borderLeftWidth: 3 }}
                  title={`${patient.name}, ${patient.age}, ${patient.symptom}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted/60 font-semibold">#{index + 1}</span>
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: severityColor[patient.severity] }} />
                      <strong className="truncate text-sm font-semibold text-ink">{patient.name}</strong>
                      {patient.escalatedAt === tick && (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-critical/10 text-critical">
                          <AlertTriangle className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted leading-relaxed capitalize">{patient.symptom} &middot; {patient.source}</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border leading-none shrink-0 ${patient.escalatedAt === tick ? "severity-flash" : ""}`}
                      style={{ 
                        borderColor: `${severityColor[patient.severity]}30`, 
                        color: severityColor[patient.severity],
                        backgroundColor: `${severityColor[patient.severity]}08`
                      }}
                    >
                      {patient.severity}
                    </span>
                    <div className="flex items-center justify-end gap-1 font-mono text-xs text-muted leading-none">
                      <Timer className="h-3 w-3 text-muted/40" />
                      <span>{tick - patient.arrivalTick}s</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
