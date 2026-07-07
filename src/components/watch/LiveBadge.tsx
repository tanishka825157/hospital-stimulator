/**
 * LiveBadge — shown on the patient watch view.
 * Displays a pulsing red dot with "LIVE" text and a "Updated Xs ago" counter.
 * If the session is paused/ended, it shows a grey "OFFLINE" state instead.
 */
import { useEffect, useState } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";

export function LiveBadge() {
  const { running, sessionEnded, tick } = useSimulationStore();
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  // Reset counter on every tick
  useEffect(() => {
    setSecondsSinceUpdate(0);
    const interval = setInterval(() => setSecondsSinceUpdate((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [tick]);

  if (sessionEnded) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-line bg-elevated/40 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-muted/40" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Offline</span>
      </div>
    );
  }

  if (!running) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-line bg-elevated/40 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-moderate/60 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-moderate/80">Paused</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-critical/30 bg-critical/10 px-3 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-critical opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-critical" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-critical">Live</span>
      </div>
      <span className="text-[10px] text-muted/60 font-mono">
        {secondsSinceUpdate === 0 ? "Just updated" : `Updated ${secondsSinceUpdate}s ago`}
      </span>
    </div>
  );
}
