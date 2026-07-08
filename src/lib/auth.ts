/**
 * Authentication helpers — supports both Supabase and Demo Mode.
 *
 * DEMO MODE activates automatically when VITE_SUPABASE_URL is not configured
 * (i.e., still set to the placeholder value or missing entirely).
 * In demo mode, auth is handled via localStorage with fixed demo accounts:
 *
 *   Admin:   admin@hospital.com   / admin123
 *   Patient: patient@hospital.com / patient123
 *
 * Demo mode is single-browser only — no real-time multi-device sync.
 * Configure Supabase in .env to unlock full multi-device features.
 */
import { supabase, TABLES, isDemoMode } from "@/lib/supabase";

export type Role = "admin" | "patient";

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  displayName: string;
}

// ─── DEMO ACCOUNTS ────────────────────────────────────────────────────────────
const DEMO_ACCOUNTS: Record<string, { password: string; role: Role; displayName: string }> = {
  "admin@hospital.com":   { password: "admin123",   role: "admin",   displayName: "Dr. Admin" },
  "patient@hospital.com": { password: "patient123", role: "patient", displayName: "Patient Viewer" },
};

const DEMO_SESSION_KEY = "hospital-sim-demo-session";

function demoSignIn(email: string, password: string): UserProfile {
  const account = DEMO_ACCOUNTS[email.toLowerCase()];
  if (!account || account.password !== password) {
    throw new Error("Invalid email or password.");
  }
  const profile: UserProfile = {
    id: `demo-${email}`,
    email,
    role: account.role,
    displayName: account.displayName,
  };
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile));
  return profile;
}

function demoSignOut(): void {
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export function getDemoSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/** Sign in with email and password. Works in both demo and Supabase mode. */
export async function signIn(email: string, password: string): Promise<UserProfile> {
  if (isDemoMode) return demoSignIn(email, password);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("No user returned from sign-in.");
  return fetchProfile(data.user.id, data.user.email ?? "");
}

/** Sign up as a patient. In demo mode, throws a helpful message. */
export async function signUp(email: string, password: string, displayName?: string): Promise<UserProfile> {
  if (isDemoMode) {
    throw new Error(
      "Sign-up is disabled in Demo Mode. Use the demo credentials below, or configure Supabase in .env to enable real accounts."
    );
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "patient", display_name: displayName ?? email } },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("No user returned from sign-up.");
  return fetchProfile(data.user.id, data.user.email ?? "");
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
  if (isDemoMode) { demoSignOut(); return; }
  await supabase.auth.signOut();
}

/** Fetch a user's profile row (id + role) from the profiles table. */
export async function fetchProfile(userId: string, email: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from(TABLES.profiles)
    .select("id, role, display_name")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { id: userId, email, role: "patient", displayName: email };
  }

  return {
    id: data.id,
    email,
    role: data.role as Role,
    displayName: data.display_name ?? email,
  };
}

/** Get the currently authenticated session and profile, or null if not logged in. */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  if (isDemoMode) return getDemoSession();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return fetchProfile(session.user.id, session.user.email ?? "");
}
