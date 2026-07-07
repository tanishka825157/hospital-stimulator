import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, SunMedium, Moon, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/store/useSimulationStore";

export function Controls() {
  const { running, config, learnMode, actions } = useSimulationStore();
  const [lightMode, setLightMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("light-mode", lightMode);
    document.documentElement.style.colorScheme = lightMode ? "light" : "dark";
  }, [lightMode]);

  return (
    <div className="flex shrink-0 items-center justify-end gap-2">
      <Button 
        variant={running ? "secondary" : "default"} 
        size="icon" 
        title={running ? "Pause" : "Start"} 
        onClick={running ? actions.pause : actions.start}
      >
        {running ? <Pause className="h-4 w-4 text-accent" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button variant="secondary" size="icon" title="Reset" onClick={actions.reset}>
        <RotateCcw className="h-4 w-4" />
      </Button>
      <select 
        className="h-10 rounded-xl border border-line bg-panel hover:border-accent/40 focus:ring-1 focus:ring-accent outline-none px-4 text-sm text-ink transition-all cursor-pointer font-medium"
        onChange={(event) => actions.applyScenario(event.target.value as "normal")} 
        defaultValue="normal"
      >
        <option value="normal">Normal Day</option>
        <option value="mass-casualty">Mass Casualty</option>
        <option value="night-shift">Night Shift</option>
      </select>
      <select 
        className="h-10 rounded-xl border border-line bg-panel hover:border-accent/40 focus:ring-1 focus:ring-accent outline-none px-4 font-mono text-sm text-ink transition-all cursor-pointer font-semibold"
        value={config.speed} 
        onChange={(event) => actions.setSpeed(Number(event.target.value))}
      >
        {[0.5, 1, 2, 5].map((speed) => (
          <option value={speed} key={speed}>
            {speed}x
          </option>
        ))}
      </select>
      <Button variant={learnMode ? "default" : "secondary"} onClick={() => actions.setLearnMode(!learnMode)}>
        <GraduationCap className="h-4 w-4" />
        Learn {learnMode ? "On" : "Off"}
      </Button>
      <Button variant="ghost" size="icon" title={lightMode ? "Dark mode" : "Light mode"} onClick={() => setLightMode((value) => !value)}>
        {lightMode ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      </Button>
    </div>
  );
}
