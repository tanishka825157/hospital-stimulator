/**
 * OfflineState — shown to patients when the admin has ended the session
 * or the connection has dropped. Never a blank screen or frozen dashboard.
 */
import { motion } from "framer-motion";
import { WifiOff } from "lucide-react";

interface OfflineStateProps {
  reason?: "ended" | "disconnected";
}

export function OfflineState({ reason = "ended" }: OfflineStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-command p-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6 text-center"
      >
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-elevated">
          <WifiOff className="h-7 w-7 text-muted/60" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            {reason === "ended" ? "Simulation ended" : "Connection lost"}
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            {reason === "ended"
              ? "The admin has ended this broadcast session. No data is being received right now."
              : "Lost connection to the live feed. The admin may have closed their tab or lost internet access."}
          </p>
        </div>

        {/* Explanation */}
        <div className="rounded-xl border border-line bg-panel/60 px-6 py-4 text-left text-xs leading-relaxed text-muted space-y-2">
          <p className="font-semibold text-ink">What happened?</p>
          <p>
            In this simulator, the engine runs inside the admin's browser tab.
            When they close or pause the session, the live feed stops — this is by design in v2.
          </p>
          <p className="text-muted/70">
            Wait for the admin to start a new session, then refresh this page.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-elevated px-6 text-sm font-medium text-ink transition-all hover:border-accent/40 hover:text-accent active:scale-[0.98]"
        >
          Refresh page
        </button>
      </motion.div>
    </div>
  );
}
