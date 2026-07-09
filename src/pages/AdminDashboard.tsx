/**
 * AdminDashboard — the full simulation control room.
 *
 * This is the restored + upgraded version of the original App.tsx dashboard.
 * Admin-only features added:
 *   - "Live · N watching" badge in header
 *   - Manual patient injection panel (sidebar)
 *   - Doctor status override via DoctorOverridePanel
 *   - ICU bed maintenance via ICUOverridePanel
 *   - Kill switch with confirm dialog
 *
 * The simulation engine runs here. When the admin closes this tab,
 * the simulation pauses — this is a known v2 limitation.
 * (v3 stretch goal: move engine to a persistent Node worker.)
 */
import { useState, useEffect } from "react";
import { Activity, Ambulance, BarChart3, Bed, LayoutDashboard, ListTree, Stethoscope, LogOut, Radio, Users, XCircle, SunMedium, Moon, Pause, Play, RotateCcw, ClipboardList } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AmbulancePanel } from "@/components/ambulances/AmbulancePanel";
import { ConfigSliders } from "@/components/dashboard/ConfigSliders";
import { StatTicker } from "@/components/dashboard/StatTicker";
import { DoctorOverridePanel } from "@/components/admin/DoctorOverridePanel";
import { ICUOverridePanel } from "@/components/admin/ICUOverridePanel";
import { ManualPatientInject } from "@/components/admin/ManualPatientInject";
import { QueuePanel } from "@/components/queue/QueuePanel";
import { ReportsPanel } from "@/components/reports/ReportsPanel";
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

export function AdminDashboard() {
  const { selectedView, capacityCrisis, running, config, viewerCount, sessionEnded, actions } = useSimulationStore();
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.actions.logout);
  const [lightMode, setLightMode] = useState(false);
  const [showKillConfirm, setShowKillConfirm] = useState(false);

  // Start broadcasting to Supabase Realtime
  useRealtimeSync("admin", profile?.id ?? "admin");

  useEffect(() => {
    document.documentElement.classList.toggle("light-mode", lightMode);
    document.documentElement.style.colorScheme = lightMode ? "light" : "dark";
  }, [lightMode]);

  return (
    <div className="min-h-screen bg-command text-ink selection:bg-accent/20">
      {/* ─── SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-10 w-[240px] border-r border-line bg-panel p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-command shadow-sm">
            <Activity className="h-5 w-5 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-ink">EmergencySim</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Admin Control</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = selectedView === item.label;
            return (
              <Button
                key={item.label}
                variant="ghost"
                className={cn(
                  "relative w-full justify-start rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-all",
                  isActive ? "border-accent bg-accent/5 text-accent font-semibold" : "text-muted hover:bg-elevated/40 hover:text-ink"
                )}
                onClick={() => actions.setSelectedView(item.label)}
              >
                <item.icon className={cn("h-4 w-4 mr-3 transition-colors", isActive ? "text-accent" : "text-muted")} />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Sidebar bottom — inject + logout */}
        <div className="space-y-3 border-t border-line pt-4">
          <ManualPatientInject />
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              {viewerCount} watching
            </span>
            <button onClick={() => setLightMode((v) => !v)} className="rounded p-1 hover:bg-elevated/60 transition-colors">
              {lightMode ? <Moon className="h-3.5 w-3.5" /> : <SunMedium className="h-3.5 w-3.5" />}
            </button>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted hover:text-ink" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* ─── MAIN ────────────────────────────────────────────────── */}
      <main className="pl-[240px] flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-line bg-command/95 backdrop-blur-sm px-8 py-3 flex flex-col gap-3">
          <div className="flex h-12 items-center justify-between gap-6">
            <div className="min-w-[240px]">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-accent">Admin · Live Operations</p>
              <h2 className="text-base font-bold tracking-tight text-ink">Hospital Emergency Simulator</h2>
            </div>
            <StatTicker />
            {/* Controls */}
            <div className="flex shrink-0 items-center gap-2">
              {/* LIVE · N watching */}
              <div className="flex items-center gap-2 rounded-full border border-critical/30 bg-critical/8 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full bg-critical opacity-75 ${running ? "animate-ping" : ""}`} />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-critical" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-critical">Live</span>
                {viewerCount > 0 && (
                  <span className="ml-1 flex items-center gap-1 text-[10px] text-muted font-mono">
                    <Radio className="h-2.5 w-2.5" />
                    {viewerCount}
                  </span>
                )}
              </div>
              <Button variant={running ? "secondary" : "default"} size="icon" title={running ? "Pause" : "Start"} onClick={running ? actions.pause : actions.start}>
                {running ? <Pause className="h-4 w-4 text-accent" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="secondary" size="icon" title="Reset" onClick={actions.reset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <select className="h-10 rounded-xl border border-line bg-panel hover:border-accent/40 focus:ring-1 focus:ring-accent outline-none px-3 text-sm text-ink transition-all cursor-pointer font-medium"
                onChange={(e) => actions.applyScenario(e.target.value as "normal")} defaultValue="normal">
                <option value="normal">Normal Day</option>
                <option value="mass-casualty">Mass Casualty</option>
                <option value="night-shift">Night Shift</option>
              </select>
              <select className="h-10 rounded-xl border border-line bg-panel hover:border-accent/40 focus:ring-1 focus:ring-accent outline-none px-3 font-mono text-sm text-ink transition-all cursor-pointer font-semibold"
                value={config.speed} onChange={(e) => actions.setSpeed(Number(e.target.value))}>
                {[0.5, 1, 2, 5].map((s) => <option value={s} key={s}>{s}x</option>)}
              </select>
              {/* Kill switch */}
              <Button variant="danger" size="icon" title="End broadcast session" onClick={() => setShowKillConfirm(true)}>
                <XCircle className="h-4 w-4 text-critical" />
              </Button>
            </div>
          </div>

          {capacityCrisis && (
            <div className="crisis-pulse rounded-xl border border-critical/50 bg-critical/10 px-4 py-2.5 text-xs font-medium text-critical flex items-center gap-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-critical animate-ping" />
              ICU capacity crisis detected. Critical patients are waiting without available beds.
            </div>
          )}
        </header>

        {/* Kill switch confirm modal */}
        <AnimatePresence>
          {showKillConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-command/80 backdrop-blur-sm"
            >
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-sm rounded-2xl border border-critical/30 bg-panel p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-ink">End broadcast session?</h3>
                <p className="text-sm text-muted">All connected patient views will see "Simulation ended." The simulation will pause and cannot be resumed from this state.</p>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowKillConfirm(false)}>Cancel</Button>
                  <Button className="flex-1 bg-critical text-white hover:opacity-90" onClick={() => { actions.endSession(); setShowKillConfirm(false); }}>
                    End Session
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div key={selectedView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
              {selectedView === "Dashboard" && <AdminDashboardGrid />}
              {selectedView === "Queue" && <QueuePanel editable />}
              {selectedView === "Doctors" && <DoctorOverridePanel />}
              {selectedView === "ICU" && <ICUOverridePanel />}
              {selectedView === "Ambulances" && <AmbulancePanel editable />}
              {selectedView === "Reports" && <ReportsPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Session ended overlay (after kill switch) */}
      <AnimatePresence>
        {sessionEnded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-command/90 backdrop-blur-sm">
            <div className="rounded-2xl border border-line bg-panel p-8 text-center space-y-4 max-w-sm">
              <XCircle className="h-10 w-10 text-muted mx-auto" />
              <h3 className="text-lg font-bold text-ink">Session Ended</h3>
              <p className="text-sm text-muted">You have ended the broadcast. Patients now see the offline state.</p>
              <Button onClick={() => { actions.reset(); }} className="w-full">Start New Session</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminDashboardGrid() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-7"><QueuePanel editable /></div>
      <div className="col-span-5 space-y-6">
        <ConfigSliders />
        <ActivityFeed />
        <DoctorOverridePanel />
      </div>
      <div className="col-span-7"><ICUOverridePanel /></div>
      <div className="col-span-5"><AmbulancePanel editable /></div>
      <div className="col-span-12"><ReportsPanel /></div>
    </div>
  );
}

function ActivityFeed() {
  const events = useSimulationStore((state) => state.events);
  const recentEvents = events.slice(0, 8);

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Activity</h3>
        <ClipboardList className="h-4 w-4 text-accent" />
      </div>
      {recentEvents.length === 0 ? (
        <p className="text-xs leading-relaxed text-muted/70">Manual actions will appear here as the admin operates the scenario.</p>
      ) : (
        <div className="space-y-2">
          {recentEvents.map((event) => (
            <div key={event.id} className="rounded-lg border border-line/50 bg-elevated/30 px-3 py-2">
              <div className="font-mono text-[10px] font-semibold text-accent">t+{event.tick}s</div>
              <p className="mt-0.5 text-xs leading-relaxed text-ink/80">{event.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
