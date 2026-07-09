/**
 * ICUOverridePanel — Admin-only ICU bed maintenance controls.
 * ICU beds no longer auto-fill or auto-release. Admins assign patients from
 * the queue and discharge them here when care is complete.
 */
import { Bed, Siren, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

      <CardContent className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3">
        {icuBeds.map((bed) => {
          const patient = bed.patient;
          const severity = patient?.severity;
          const occupied = !!patient;
          const isMaintenance = !!bed.maintenance;

          return (
            <motion.div
              layout
              key={bed.id}
              className={`min-h-[112px] rounded-xl border flex flex-col justify-between p-2.5 transition-all duration-300 group ${
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
              title={isMaintenance ? "Under maintenance" : occupied ? patient?.name : "Open bed"}
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

              {occupied && patient ? (
                <Button size="sm" variant="secondary" className="h-7 px-2 text-[10px]" onClick={() => actions.dischargePatient(patient.id)}>
                  Discharge
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[10px]"
                  onClick={() => actions.setBedStatus(bed.id, isMaintenance ? "Empty" : "Under Maintenance")}
                >
                  {isMaintenance ? "Restore" : "Maint."}
                </Button>
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
