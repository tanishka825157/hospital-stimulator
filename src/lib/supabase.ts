/**
 * Supabase client singleton.
 *
 * This file creates the single Supabase JS client used everywhere in the app.
 * Import `supabase` from here — never create a second client instance.
 *
 * Credentials come from Vite env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 * These are safe to expose in the browser because Supabase's Row Level Security
 * (RLS) policies, not the anon key, are what protect your data.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl.includes("your-project")) {
  console.warn(
    "[HospitalSim] Supabase not configured. Copy .env.example → .env and fill in your project URL and anon key.\n" +
    "Get them from: Supabase Dashboard → Settings → API"
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

/** Type-safe table name helpers */
export const TABLES = {
  profiles: "profiles",
  simulationState: "simulation_state",
} as const;

/** Realtime channel name shared by admin (broadcast) and patients (subscribe) */
export const SIM_CHANNEL = "simulation-broadcast";
