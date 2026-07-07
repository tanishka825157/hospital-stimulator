/**
 * useRealtimeSync — Supabase Realtime sync layer.
 *
 * In DEMO MODE: this hook is a no-op. The simulation engine runs locally
 * and the patient view reads directly from the same store in the same tab.
 * Multi-device sync requires Supabase — configure .env to unlock it.
 *
 * In SUPABASE MODE:
 *
 * ADMIN ROLE:
 *   - On every simulation store state change, pushes the full snapshot
 *     JSON to Supabase's `simulation_state` table.
 *   - Joins a Presence channel to track how many patient sessions are watching.
 *
 * PATIENT ROLE:
 *   - Subscribes to Realtime changes on `simulation_state`.
 *   - On each change, calls `useSimulationStore.actions.hydrate(snapshot)`
 *     to update the patient's local view.
 *   - Joins the Presence channel so the admin can count viewers.
 *   - If `snapshot.sessionEnded` is true, shows the offline screen.
 */
import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { isDemoMode, supabase, TABLES, SIM_CHANNEL } from "@/lib/supabase";
import { useSimulationStore } from "@/store/useSimulationStore";
import type { SimulationSnapshot } from "@/engine/SimulationEngine";

type SyncRole = "admin" | "patient";

export function useRealtimeSync(role: SyncRole, userId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { actions } = useSimulationStore();

  useEffect(() => {
    // ── DEMO MODE: no-op ──────────────────────────────────────────────────
    if (isDemoMode) return;

    // ── SUPABASE MODE ─────────────────────────────────────────────────────
    const channel = supabase.channel(SIM_CHANNEL, {
      config: { presence: { key: userId } },
    });
    channelRef.current = channel;

    if (role === "admin") {
      const unsubscribe = useSimulationStore.subscribe(async (state) => {
        const snapshot: Partial<SimulationSnapshot> = {
          running: state.running,
          tick: state.tick,
          config: state.config,
          queue: state.queue,
          doctors: state.doctors,
          icuBeds: state.icuBeds,
          ambulances: state.ambulances,
          events: state.events.slice(0, 50),
          metrics: state.metrics.slice(-60),
          stats: state.stats,
          capacityCrisis: state.capacityCrisis,
          sessionEnded: state.sessionEnded,
        };

        await supabase
          .from(TABLES.simulationState)
          .update({ snapshot, updated_at: new Date().toISOString(), session_active: !state.sessionEnded })
          .eq("id", 1);
      });

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Math.max(0, Object.keys(state).length - 1);
        actions.setViewerCount(count);
      });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ role: "admin", userId });
        }
      });

      return () => {
        unsubscribe();
        channel.unsubscribe();
      };

    } else {
      // PATIENT
      channel
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: TABLES.simulationState },
          (payload) => {
            const incoming = payload.new?.snapshot as SimulationSnapshot | undefined;
            if (incoming) actions.hydrate(incoming);
          }
        )
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ role: "patient", userId });
            const { data } = await supabase
              .from(TABLES.simulationState)
              .select("snapshot")
              .eq("id", 1)
              .single();
            if (data?.snapshot) actions.hydrate(data.snapshot as SimulationSnapshot);
          }
        });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [role, userId, actions]);
}
