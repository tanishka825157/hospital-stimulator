/**
 * ICUOverridePanel — Admin-only ICU bed maintenance controls.
 * Extends ICUPanel with a toggle per bed to mark it "Under Maintenance".
 * Maintenance beds are shown with a distinct amber style and are skipped
 * by the engine when admitting CRITICAL patients.
 */
import { Bed, Siren, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { severityColor } from "@/engine/Patient";
import { useSimulationStore } from "@/store/useSimulationStore";

export function ICUOverridePanel() {
  const { icuBeds, capacityCrisis, actions } = useSimulationStore();

  return (
    <Card className={capacityCrisis ? "border-critical/50 shadow-[0_0_12px_rgba(239,68,68,0.05)]" : ""}>
      <CardHeader>
        <CardTitle>ICU Capacity</CardTitle>
        {capacityCrisis ? (
          <Siren className="h-4 w-4 text-critical animate-bounce" />
        ) : (
          <Bed className="h-4 w-4 text-accent" />
        )}
      </CardHeader>

      {capacityCrisis && (
        <div className="crisis-pulse border-b border-critical/20 bg-critical/5 px-6 py-2.5 text-xs font-semibold text-critical flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-critical shrink-0 animate-ping" />
          Capacity Crisis: CRITICAL patient waiting while ICU is full.
        </div>
      )}

      <CardContent className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3">
        {icuBeds.map((bed) => {
          const patient = bed.patient;
          const severity = patient?.severity;
          const occupied = !!patient;
          const isMaintenance = !!bed.maintenance;

          return (
            <motion.div
              layout
              key={bed.id}
              className={`aspect-square rounded-xl border flex flex-col justify-between p-2.5 transition-all duration-300 cursor-pointer group ${
                isMaintenance
                  ? "border-moderate/40 bg-moderate/8 hover:border-moderate/70"
                  : occupied
                    ? "shadow-sm"
                    : "border-line bg-transparent hover:border-accent/30 hover:bg-elevated/10"
              }`}
              style={!isMaintenance && severity ? {
                borderColor: `${severityColor[severity]}40`,
                backgroundColor: `${severityColor[severity]}12`
              } : {}}
              title={isMaintenance ? "Click to restore bed" : "Click to mark as maintenance"}
              onClick={() => !occupied && actions.setICUBedMaintenance(bed.id, !isMaintenance)}
            >
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted/60 leading-none">
                <span>{bed.id}</span>
                {isMaintenance ? (
                  <Wrench className="h-3 w-3 text-moderate/70" />
                ) : (
                  <Bed className={`h-3 w-3 ${occupied ? "" : "opacity-30"}`} style={{ color: severity ? severityColor[severity] : "inherit" }} />
                )}
              </div>

              <div className="text-center my-1.5">
                <p
                  className={`font-mono text-base font-extrabold tracking-tight leading-none ${
                    isMaintenance ? "text-moderate/60" : occupied ? "text-ink" : "text-muted/20"
                  }`}
                  style={!isMaintenance && severity ? { color: severityColor[severity] } : {}}
                >
                  {isMaintenance ? "⚙" : patient ? initials(patient.name) : "--"}
                </p>
              </div>

              <div className="text-center leading-none">
                <span className={`font-mono text-[9px] font-bold uppercase tracking-wider leading-none ${isMaintenance ? "text-moderate/60" : "text-muted/50"}`}>
                  {isMaintenance ? "Maint." : patient ? `${bed.remainingTicks}s` : "Open"}
                </span>
              </div>

              {/* Hover hint for unoccupied beds */}
              {!occupied && !isMaintenance && (
                <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-command/60 text-[9px] text-muted font-bold">
                  Set Maint.
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>

      <div className="border-t border-line px-6 py-3 flex items-center gap-4 text-[10px] text-muted">
        <span className="flex items-center gap-1.5"><Wrench className="h-3 w-3 text-moderate/70" /> Click free bed to toggle maintenance</span>
      </div>
    </Card>
  );
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
