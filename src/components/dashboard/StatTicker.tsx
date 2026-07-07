import { Activity, Bed, Clock3, UsersRound } from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function StatTicker() {
  const { tick, queue, doctors, icuBeds, stats } = useSimulationStore();
  const activeDoctors = doctors.filter((doctor) => doctor.status === "Treating").length;
  const occupiedBeds = icuBeds.filter((bed) => bed.patient).length;

  const clockValue = `${Math.floor(tick / 60)}:${String(tick % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-1 items-center justify-center gap-3">
      {/* Clock Chip */}
      <div className="flex items-center gap-2 border border-line bg-panel/60 px-3 py-1.5 rounded-lg shadow-sm">
        <Clock3 className="h-3.5 w-3.5 text-accent" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-muted font-bold leading-none">Clock</span>
          <span className="font-mono text-xs text-ink font-semibold mt-0.5">{clockValue}</span>
        </div>
      </div>

      {/* Queue Chip */}
      <div className="flex items-center gap-2 border border-line bg-panel/60 px-3 py-1.5 rounded-lg shadow-sm">
        <UsersRound className="h-3.5 w-3.5 text-accent" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-muted font-bold leading-none">Queue</span>
          <span className="font-mono text-xs text-ink font-semibold mt-0.5">
            <AnimatedNumber value={queue.length} />
          </span>
        </div>
      </div>

      {/* Doctors Chip */}
      <div className="flex items-center gap-2 border border-line bg-panel/60 px-3 py-1.5 rounded-lg shadow-sm">
        <Activity className="h-3.5 w-3.5 text-accent" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-muted font-bold leading-none">Doctors</span>
          <span className="font-mono text-xs text-ink font-semibold mt-0.5">
            <AnimatedNumber value={activeDoctors} />/{doctors.length}
          </span>
        </div>
      </div>

      {/* ICU Load Chip */}
      <div className="flex items-center gap-2 border border-line bg-panel/60 px-3 py-1.5 rounded-lg shadow-sm">
        <Bed className="h-3.5 w-3.5 text-accent" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-muted font-bold leading-none">ICU Beds</span>
          <span className="font-mono text-xs text-ink font-semibold mt-0.5">
            <AnimatedNumber value={occupiedBeds} />/{icuBeds.length}
          </span>
        </div>
      </div>

      {/* Treated Chip */}
      <div className="flex items-center gap-2 border border-line bg-panel/60 px-3 py-1.5 rounded-lg shadow-sm">
        <Activity className="h-3.5 w-3.5 text-accent" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-muted font-bold leading-none">Treated</span>
          <span className="font-mono text-xs text-ink font-semibold mt-0.5">
            <AnimatedNumber value={stats.treated} />
          </span>
        </div>
      </div>
    </div>
  );
}
