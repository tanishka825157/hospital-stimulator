/**
 * Supabase client singleton.
 *
 * Exports `isDemoMode` — true when Supabase credentials are not configured.
 * In demo mode, auth and sync fall back to localStorage/no-op implementations.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

/**
 * True when the app is running without real Supabase credentials.
 * Demo mode: localhost auth only, no realtime sync.
 */
export const isDemoMode =
  !supabaseUrl ||
  supabaseUrl.includes("your-project") ||
  supabaseUrl.trim() === "";

if (isDemoMode) {
  console.info(
    "[HospitalSim] Running in DEMO MODE 🎭\n" +
    "Demo credentials:\n" +
    "  Admin:   admin@hospital.com   / admin123\n" +
    "  Patient: patient@hospital.com / patient123\n" +
    "To enable multi-device sync, add Supabase credentials to .env"
  );
}

export const supabase = createClient(
  isDemoMode ? "https://placeholder.supabase.co" : supabaseUrl,
  isDemoMode ? "placeholder-key" : supabaseAnonKey
);

/** Type-safe table name helpers */
export const TABLES = {
  profiles: "profiles",
  simulationState: "simulation_state",
} as const;

/** Realtime channel name shared by admin (broadcast) and patients (subscribe) */
export const SIM_CHANNEL = "simulation-broadcast";
