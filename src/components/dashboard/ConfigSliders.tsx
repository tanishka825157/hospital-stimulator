import { SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimulationStore } from "@/store/useSimulationStore";

const controls = [
  { key: "doctorCount", label: "Doctors", min: 1, max: 10 },
  { key: "icuBedCount", label: "ICU Beds", min: 2, max: 14 },
  { key: "ambulanceCount", label: "Ambulances", min: 1, max: 8 }
] as const;

export function ConfigSliders() {
  const { config, actions } = useSimulationStore();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity Inputs</CardTitle>
        <SlidersHorizontal className="h-4 w-4 text-accent" />
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
              title={control.label}
              onChange={(event) => actions.updateConfig({ [control.key]: Number(event.target.value) })}
            />
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
