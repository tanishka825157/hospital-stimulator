/**
 * WatchDashboard — the patient's live read-only broadcast view.
 *
 * Patients never see simulation controls (not disabled — fully absent from DOM).
 * All state comes from Supabase Realtime via useRealtimeSync + store.hydrate().
 */
import { useState } from "react";
import { Activity, BarChart3, Ambulance, Bed, ClipboardList, LayoutDashboard, ListTree, LogOut, Stethoscope } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AmbulancePanel } from "@/components/ambulances/AmbulancePanel";
import { DoctorPanel } from "@/components/doctors/DoctorPanel";
import { ICUPanel } from "@/components/icu/ICUPanel";
import { QueuePanel } from "@/components/queue/QueuePanel";
import { ReportsPanel } from "@/components/reports/ReportsPanel";
import { StatTicker } from "@/components/dashboard/StatTicker";
import { LiveBadge } from "@/components/watch/LiveBadge";
import { OfflineState } from "@/components/watch/OfflineState";
import { AboutPanel } from "@/components/watch/AboutPanel";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRealtimeSync } from "@/sync/useRealtimeSync";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Queue", icon: ListTree },
  { label: "Doctors", icon: Stethoscope },
  { label: "ICU", icon: Bed },
  { label: "Ambulances", icon: Ambulance },
  { label: "Reports", icon: BarChart3 }
] as const;

type View = "Dashboard" | "Queue" | "Doctors" | "ICU" | "Ambulances" | "Reports";

export function WatchDashboard() {
  const { sessionEnded, capacityCrisis, tick } = useSimulationStore();
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.actions.logout);
  const [selectedView, setSelectedView] = useState<View>("Dashboard");

  // Subscribe to Supabase Realtime as a patient (read-only)
  useRealtimeSync("patient", profile?.id ?? "patient");

  // Show offline state if session ended or no data yet
  if (sessionEnded) {
    return <OfflineState reason="ended" />;
  }

  // Show a waiting state if tick is 0 (no data received yet)
  if (tick === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-command p-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-elevated">
            <Activity className="h-7 w-7 text-accent animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Waiting for simulation…</h2>
            <p className="text-sm text-muted mt-1">Connecting to live feed. The admin may not have started yet.</p>
          </div>
          <LiveBadge />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-command text-ink selection:bg-accent/20">
      {/* ─── SIDEBAR ──────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-10 w-[220px] border-r border-line bg-panel p-5 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-ink">EmergencySim</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Live Watch</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {(["Dashboard", "Queue", "Doctors", "ICU", "Ambulances", "Reports"] as View[]).map((view) => {
            const item = navItems.find((n) => n.label === view)!;
            const isActive = selectedView === view;
            return (
              <Button
                key={view}
                variant="ghost"
                className={cn(
                  "relative w-full justify-start rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-all",
                  isActive ? "border-accent bg-accent/5 text-accent font-semibold" : "text-muted hover:bg-elevated/40 hover:text-ink"
                )}
                onClick={() => setSelectedView(view)}
              >
                <item.icon className={cn("h-4 w-4 mr-3", isActive ? "text-accent" : "text-muted")} />
                {view}
              </Button>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-line pt-4">
          <div className="text-[10px] text-muted/60 text-center">
            Signed in as <span className="text-ink font-medium">{profile?.displayName}</span>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted hover:text-ink" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* ─── MAIN ─────────────────────────────────────────────── */}
      <main className="pl-[220px] flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-line bg-command/95 backdrop-blur-sm px-8 py-3 flex flex-col gap-3">
          <div className="flex h-12 items-center justify-between gap-6">
            <div className="min-w-[200px]">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-accent">Patient · Read Only</p>
              <h2 className="text-base font-bold tracking-tight text-ink">Hospital Emergency Simulator</h2>
            </div>
            <StatTicker />
            <LiveBadge />
          </div>

          {capacityCrisis && (
            <div className="crisis-pulse rounded-xl border border-critical/50 bg-critical/10 px-4 py-2.5 text-xs font-medium text-critical flex items-center gap-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-critical animate-ping" />
              ICU capacity crisis — critical patients waiting for beds.
            </div>
          )}
        </header>

        {/* Content + live activity sidebar */}
        <div className="flex flex-1">
          <div className="flex-1 p-8 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div key={selectedView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
                {selectedView === "Dashboard" && <WatchGrid />}
                {selectedView === "Queue" && <QueuePanel />}
                {selectedView === "Doctors" && <DoctorPanel />}
                {selectedView === "ICU" && <ICUPanel />}
                {selectedView === "Ambulances" && <AmbulancePanel />}
                {selectedView === "Reports" && <ReportsPanel />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right sidebar — live activity + About */}
          <aside className="w-[300px] shrink-0 border-l border-line bg-panel/40 p-6 space-y-6 overflow-y-auto thin-scrollbar">
            <ActivityFeed />
            <AboutPanel />
          </aside>
        </div>
      </main>
    </div>
  );
}

function ActivityFeed() {
  const events = useSimulationStore((state) => state.events);
  const recentEvents = events.slice(0, 8);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted">Live Activity</h3>
        <ClipboardList className="h-4 w-4 text-accent" />
      </div>
      {recentEvents.length === 0 ? (
        <p className="text-xs text-muted/60 leading-relaxed">Admin actions will appear here as the scenario runs.</p>
      ) : (
        <div className="space-y-3">
          {recentEvents.map((event) => (
            <div key={event.id} className="rounded-xl border border-line bg-elevated/40 px-3 py-3 space-y-1">
              <div className="font-mono text-[10px] text-accent font-semibold flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-accent animate-ping" />
                t+{event.tick}s
              </div>
              <p className="text-xs leading-relaxed text-ink/80">{event.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WatchGrid() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-7"><QueuePanel /></div>
      <div className="col-span-5"><DoctorPanel /></div>
      <div className="col-span-7"><ICUPanel /></div>
      <div className="col-span-5"><AmbulancePanel /></div>
    </div>
  );
}
