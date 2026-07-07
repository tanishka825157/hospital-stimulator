/**
 * useRealtimeSync — Supabase Realtime sync layer.
 *
 * This hook has two modes, selected by the `role` parameter:
 *
 * ADMIN MODE:
 *   - On every simulation store state change, pushes the full snapshot
 *     JSON to Supabase's `simulation_state` table.
 *   - Joins a Presence channel to track how many patient sessions are watching.
 *   - The Admin's browser tab IS the simulation engine. If the tab closes,
 *     the simulation pauses (known v2 limitation; v3 stretch goal: move engine
 *     to a persistent Node worker).
 *
 * PATIENT MODE:
 *   - Subscribes to Realtime changes on `simulation_state`.
 *   - On each change, calls `useSimulationStore.actions.hydrate(snapshot)`
 *     to update the patient's local view.
 *   - Joins the Presence channel so the admin can count viewers.
 *   - If `snapshot.sessionEnded` is true, the patient sees an offline screen.
 *
 * IMPORTANT: Sync logic lives here, NOT inside SimulationEngine.
 * The engine remains framework-agnostic and localStorage-free.
 */
import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, TABLES, SIM_CHANNEL } from "@/lib/supabase";
import { useSimulationStore } from "@/store/useSimulationStore";
import type { SimulationSnapshot } from "@/engine/SimulationEngine";

type SyncRole = "admin" | "patient";

export function useRealtimeSync(role: SyncRole, userId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { actions } = useSimulationStore();

  useEffect(() => {
    // Create the Realtime channel with Presence enabled
    const channel = supabase.channel(SIM_CHANNEL, {
      config: { presence: { key: userId } },
    });
    channelRef.current = channel;

    if (role === "admin") {
      // ── ADMIN: push snapshot to DB on every store change ──────────────────
      // We use Zustand's subscribe (not a React effect) so we get updates
      // even when the component hasn't re-rendered yet.
      const unsubscribe = useSimulationStore.subscribe(async (state) => {
        const snapshot = {
          running: state.running,
          tick: state.tick,
          config: state.config,
          queue: state.queue,
          doctors: state.doctors,
          icuBeds: state.icuBeds,
          ambulances: state.ambulances,
          events: state.events.slice(0, 50), // cap for wire size
          metrics: state.metrics.slice(-60), // keep last 60 points
          stats: state.stats,
          capacityCrisis: state.capacityCrisis,
          sessionEnded: state.sessionEnded,
        } satisfies Partial<SimulationSnapshot>;

        await supabase
          .from(TABLES.simulationState)
          .update({ snapshot, updated_at: new Date().toISOString(), session_active: !state.sessionEnded })
          .eq("id", 1);
      });

      // Track viewer presence
      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length - 1; // subtract admin's own presence
        actions.setViewerCount(Math.max(0, count));
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
      // ── PATIENT: subscribe to DB changes, hydrate local store ─────────────
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
            // Also track presence so admin sees viewer count
            await channel.track({ role: "patient", userId });

            // Fetch the current snapshot immediately (don't wait for first UPDATE)
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
