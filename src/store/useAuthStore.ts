/**
 * Auth Zustand store.
 *
 * In DEMO MODE (no Supabase configured): reads session from localStorage,
 * handles login/logout locally — no network calls.
 *
 * In SUPABASE MODE: listens to onAuthStateChange and fetches role from
 * the `profiles` table.
 */
import { create } from "zustand";
import { isDemoMode, supabase } from "@/lib/supabase";
import { signIn, signUp, signOut, fetchProfile, getDemoSession, type UserProfile } from "@/lib/auth";

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
  if (isDemoMode) {
    // ── DEMO MODE: read from localStorage immediately, no async listener ──
    const existing = getDemoSession();
    return {
      profile: existing,
      loading: false,
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
  }

  // ── SUPABASE MODE: listen to auth state changes ────────────────────────
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
    loading: true,
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
