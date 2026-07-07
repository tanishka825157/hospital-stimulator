import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimulationStore } from "@/store/useSimulationStore";

const controls = [
  { key: "arrivalRate", label: "Arrivals / min", min: 1, max: 24 },
  { key: "doctorCount", label: "Doctors", min: 1, max: 10 },
  { key: "icuBedCount", label: "ICU Beds", min: 2, max: 14 },
  { key: "ambulanceCount", label: "Ambulances", min: 1, max: 8 }
] as const;

export function ConfigSliders() {
  const { config, actions } = useSimulationStore();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Inputs</CardTitle>
        <HelpCircle className="h-4 w-4 text-accent transition-colors hover:text-accent/80 cursor-help" aria-label="Poisson arrivals model independent emergency arrivals over time." />
      </CardHeader>
      <CardContent className="space-y-4">
        {controls.map((control) => (
          <label key={control.key} className="block">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted font-medium text-xs uppercase tracking-wider">{control.label}</span>
              <span className="font-mono text-accent font-bold">{config[control.key]}</span>
            </div>
            <input
              className="w-full accent-accent h-1 bg-line rounded-lg appearance-none cursor-pointer focus:outline-none transition-all"
              type="range"
              min={control.min}
              max={control.max}
              value={config[control.key]}
              title={control.key === "arrivalRate" ? "Arrivals use a Poisson process because emergencies are independent events with an average rate." : control.label}
              onChange={(event) => actions.updateConfig({ [control.key]: Number(event.target.value) })}
            />
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
