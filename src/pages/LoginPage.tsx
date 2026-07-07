/**
 * LoginPage — sign in + sign up for Hospital Emergency Simulator v2.
 *
 * Uses Supabase auth via useAuthStore.
 * All users who sign up get role='patient' automatically (via the DB trigger).
 * To become admin, change your row in the Supabase profiles table.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, HeartPulse, Shield, UserRound, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

type Tab = "signin" | "signup";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.actions.login);
  const register = useAuthStore((state) => state.actions.register);
  const clearError = useAuthStore((state) => state.actions.clearError);
  const error = useAuthStore((state) => state.error);
  const loading = useAuthStore((state) => state.loading);

  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const switchTab = (next: Tab) => { setTab(next); clearError(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let success = false;
    if (tab === "signin") {
      success = await login(email, password);
    } else {
      success = await register(email, password, displayName);
    }
    setSubmitting(false);
    if (success) {
      // Role-based redirect happens inside RequireRole + router, but
      // we need to wait for the auth state change to populate `profile`.
      // Navigate to "/" — the router will redirect to /admin or /watch based on role.
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-command">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel — hero */}
      <div className="relative hidden overflow-hidden bg-panel lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_40%)]" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-command shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink">EmergencySim</h1>
            <p className="micro-label">Hospital Command Center</p>
          </div>
        </div>
        <div className="relative space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h2 className="max-w-md text-4xl font-bold tracking-tight text-ink">
              Real-time emergency operations, managed by role.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
              Admins control patients, doctors, and ambulance dispatch. Patients monitor ICU beds, wait times, and live hospital status — from any device, in real time.
            </p>
          </motion.div>
          <div className="grid max-w-lg grid-cols-2 gap-4">
            <Feature icon={Shield} title="Admin control" text="Register patients, manage staff, dispatch ambulances live." />
            <Feature icon={HeartPulse} title="Patient view" text="Watch live — queue, ICU, ambulances, and learning narration." />
          </div>
        </div>
        <p className="relative text-xs text-muted">Sign up as patient instantly. Admins are set via the Supabase dashboard.</p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex items-center justify-center bg-command p-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-ink">
              {tab === "signin" ? "Sign in" : "Create account"}
            </h2>
            <p className="text-sm text-muted">
              {tab === "signin" ? "Enter your credentials to access the portal." : "Sign up to watch live simulations as a patient."}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-panel p-1">
            <RoleTab active={tab === "signin"} onClick={() => switchTab("signin")} icon={UserRound} label="Sign In" />
            <RoleTab active={tab === "signup"} onClick={() => switchTab("signup")} icon={HeartPulse} label="Sign Up" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-panel p-6">
            <AnimatePresence mode="wait">
              {tab === "signup" && (
                <motion.label
                  key="displayName"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="block space-y-2 overflow-hidden"
                >
                  <span className="micro-label">Display Name</span>
                  <input className="form-input" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                </motion.label>
              )}
            </AnimatePresence>
            <label className="block space-y-2">
              <span className="micro-label">Email</span>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            <label className="block space-y-2">
              <span className="micro-label">Password</span>
              <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={tab === "signin" ? "current-password" : "new-password"} minLength={6} />
            </label>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical">
                {error}
              </motion.p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-command/40 border-t-command" />
                  {tab === "signin" ? "Signing in…" : "Creating account…"}
                </span>
              ) : (
                tab === "signin" ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          {tab === "signup" && (
            <p className="text-center text-xs text-muted">
              New accounts are created as <span className="font-medium text-ink">Patient</span> by default.
              Admin access is granted via the Supabase dashboard.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function RoleTab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: LucideIcon; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${active ? "bg-accent text-command" : "text-muted hover:bg-elevated/50 hover:text-ink"}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Feature({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-line bg-command/40 p-4">
      <Icon className="mb-3 h-5 w-5 text-accent" />
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
    </div>
  );
}
