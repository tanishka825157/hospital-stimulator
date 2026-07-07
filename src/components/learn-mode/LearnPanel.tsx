import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";

function explain(message: string) {
  if (message.includes("pulled")) return `${message} The heap returns the most urgent patient in O(log n) time, so the UI can stay live even as load grows.`;
  if (message.includes("escalated")) return `${message} Waiting too long changes the priority, which is why the queue is rebuilt after severity changes.`;
  if (message.includes("arrived")) return `${message} Arrivals follow a Poisson process: many seconds have no arrivals, then bursts can happen naturally.`;
  if (message.includes("ICU")) return `${message} CRITICAL patients bypass normal treatment when a monitored bed is free.`;
  return message;
}

export function LearnPanel() {
  const { learnMode, narration, selectedView } = useSimulationStore();
  if (!learnMode || selectedView === "Learn") return null;

  return (
    <motion.aside 
      initial={{ x: 320, opacity: 0.9 }} 
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed right-0 top-[73px] bottom-0 z-20 w-[320px] bg-[#0D1220] border-l border-line shadow-[-10px_0_30px_rgba(45,212,191,0.06)] flex flex-col"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h3 className="text-sm font-semibold tracking-tight text-ink flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-accent" />
          Learn Mode Live
        </h3>
        <span className="text-[10px] font-mono font-bold text-accent bg-accent/5 px-2 py-0.5 rounded border border-accent/15 uppercase tracking-wider animate-pulse">
          Active
        </span>
      </div>
      <div className="flex-1 overflow-y-auto thin-scrollbar p-6 space-y-4">
        {narration.length === 0 ? (
          <p className="text-xs text-muted leading-relaxed font-medium">
            Start the simulator and this panel will narrate queueing and resource decisions in plain language.
          </p>
        ) : (
          narration.map((event) => (
            <div key={event.id} className="rounded-xl border border-line bg-elevated/40 px-4 py-3.5 space-y-1.5 transition-all hover:bg-elevated/60">
              <div className="font-mono text-[10px] text-accent font-semibold flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-accent animate-ping" />
                t+{event.tick}s
              </div>
              <p className="text-xs leading-relaxed text-ink/90 font-medium">{explain(event.message)}</p>
            </div>
          ))
        )}
      </div>
    </motion.aside>
  );
}
