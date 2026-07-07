/**
 * Authentication helpers using Supabase Auth.
 *
 * This module wraps Supabase's auth methods (sign in, sign up, sign out)
 * and fetches the user's role from the `profiles` table.
 *
 * Role is stored server-side (DB row), not in localStorage or JWT claims,
 * so patients cannot elevate themselves to admin by editing local storage.
 */
import { supabase, TABLES } from "@/lib/supabase";

export type Role = "admin" | "patient";

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  displayName: string;
}

/** Sign in with email and password. Returns the user profile or throws. */
export async function signIn(email: string, password: string): Promise<UserProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("No user returned from sign-in.");
  return fetchProfile(data.user.id, data.user.email ?? "");
}

/** Sign up as a patient (role defaults to 'patient' via the DB trigger). */
export async function signUp(email: string, password: string, displayName?: string): Promise<UserProfile> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "patient", display_name: displayName ?? email } }
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("No user returned from sign-up.");
  // After sign-up the trigger creates the profile. Give it a moment then fetch.
  return fetchProfile(data.user.id, data.user.email ?? "");
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
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
    // Profile row may not exist yet (e.g. right after sign-up before trigger runs).
    // Return a default patient profile — the store will retry.
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return fetchProfile(session.user.id, session.user.email ?? "");
}
