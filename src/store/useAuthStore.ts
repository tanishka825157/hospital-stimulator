/**
 * Auth Zustand store.
 *
 * Listens to Supabase auth state changes (login, logout, token refresh)
 * and keeps a `profile` object (with role) in sync.
 *
 * Components read `useAuthStore` to get:
 *   - `profile`  — the logged-in user + their role, or null
 *   - `loading`  — true while the initial session is being fetched
 *   - `error`    — last auth error string
 *   - `actions`  — { login, signUp, logout, clearError }
 */
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { signIn, signUp, signOut, fetchProfile, type UserProfile } from "@/lib/auth";

interface AuthStore {
  profile: UserProfile | null;
  loading: boolean;
  error: string;
  actions: {
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string, displayName?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    clearError: () => void;
  };
}

export const useAuthStore = create<AuthStore>((set) => {
  // Subscribe to Supabase auth state changes.
  // This fires immediately with the current session, and again on every
  // login/logout/token-refresh — so we never need to manually fetch the session.
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await fetchProfile(session.user.id, session.user.email ?? "");
      set({ profile, loading: false });
    } else {
      set({ profile: null, loading: false });
    }
  });

  return {
    profile: null,
    loading: true, // true until onAuthStateChange fires for the first time
    error: "",

    actions: {
      login: async (email, password) => {
        set({ error: "" });
        try {
          const profile = await signIn(email, password);
          set({ profile, error: "" });
          return true;
        } catch (err) {
          set({ error: err instanceof Error ? err.message : "Login failed." });
          return false;
        }
      },

      register: async (email, password, displayName) => {
        set({ error: "" });
        try {
          const profile = await signUp(email, password, displayName);
          set({ profile, error: "" });
          return true;
        } catch (err) {
          set({ error: err instanceof Error ? err.message : "Sign-up failed." });
          return false;
        }
      },

      logout: async () => {
        await signOut();
        set({ profile: null, error: "" });
      },

      clearError: () => set({ error: "" }),
    },
  };
});
