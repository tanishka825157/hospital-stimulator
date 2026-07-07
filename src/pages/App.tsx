import { Activity, Ambulance, BarChart3, Bed, BookOpen, LayoutDashboard, ListTree, Stethoscope } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AmbulancePanel } from "@/components/ambulances/AmbulancePanel";
import { ConfigSliders } from "@/components/dashboard/ConfigSliders";
import { Controls } from "@/components/dashboard/Controls";
import { StatTicker } from "@/components/dashboard/StatTicker";
import { DoctorPanel } from "@/components/doctors/DoctorPanel";
import { ICUPanel } from "@/components/icu/ICUPanel";
import { HowItWorks } from "@/components/learn-mode/HowItWorks";
import { LearnPanel } from "@/components/learn-mode/LearnPanel";
import { QueuePanel } from "@/components/queue/QueuePanel";
import { ReportsPanel } from "@/components/reports/ReportsPanel";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/store/useSimulationStore";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Queue", icon: ListTree },
  { label: "Doctors", icon: Stethoscope },
  { label: "ICU", icon: Bed },
  { label: "Ambulances", icon: Ambulance },
  { label: "Reports", icon: BarChart3 },
  { label: "Learn", icon: BookOpen }
] as const;

export function App() {
  const { selectedView, capacityCrisis, learnMode, actions } = useSimulationStore();
  
  return (
    <div className="min-h-screen bg-command text-ink selection:bg-accent/20">
      <aside className="fixed inset-y-0 left-0 z-10 w-[240px] border-r border-line bg-panel p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-command shadow-sm">
            <Activity className="h-5 w-5 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-ink">EmergencySim</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Command Center</p>
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
                  isActive
                    ? "border-accent bg-accent/5 text-accent font-semibold"
                    : "text-muted hover:bg-elevated/40 hover:text-ink"
                )}
                onClick={() => actions.setSelectedView(item.label)}
              >
                <item.icon className={cn("h-4 w-4 mr-3 transition-colors", isActive ? "text-accent" : "text-muted")} />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </aside>

      <main className="pl-[240px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 border-b border-line bg-command/95 backdrop-blur-sm px-8 py-3 flex flex-col gap-3">
          <div className="flex h-12 items-center justify-between gap-6">
            <div className="min-w-[240px]">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-accent">Live Operations</p>
              <h2 className="text-base font-bold tracking-tight text-ink">Hospital emergency simulator</h2>
            </div>
            <StatTicker />
            <Controls />
          </div>
          {capacityCrisis && (
            <div className="crisis-pulse rounded-xl border border-critical/50 bg-critical/10 px-4 py-2.5 text-xs font-medium text-critical flex items-center gap-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-critical animate-ping" />
              ICU capacity crisis detected. Critical patients are waiting without available beds.
            </div>
          )}
        </header>

        <div className={cn("flex-1 p-8 transition-all duration-300 ease-in-out", learnMode && selectedView !== "Learn" ? "pr-[352px]" : "pr-8")}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedView} 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -8 }} 
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {selectedView === "Dashboard" && <DashboardGrid />}
              {selectedView === "Queue" && <QueuePanel />}
              {selectedView === "Doctors" && <DoctorPanel />}
              {selectedView === "ICU" && <ICUPanel />}
              {selectedView === "Ambulances" && <AmbulancePanel />}
              {selectedView === "Reports" && <ReportsPanel />}
              {selectedView === "Learn" && <HowItWorks />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <LearnPanel />
    </div>
  );
}

function DashboardGrid() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-7">
        <QueuePanel />
      </div>
      <div className="col-span-5 space-y-6">
        <ConfigSliders />
        <DoctorPanel />
      </div>
      <div className="col-span-7">
        <ICUPanel />
      </div>
      <div className="col-span-5">
        <AmbulancePanel />
      </div>
      <div className="col-span-12">
        <ReportsPanel />
      </div>
    </div>
  );
}
