/**
 * LoginPage — sign in + sign up for Hospital Emergency Simulator v2.
 *
 * In DEMO MODE: shows a credential card with one-click fill buttons.
 *   Admin:   admin@hospital.com   / admin123
 *   Patient: patient@hospital.com / patient123
 *
 * In SUPABASE MODE: full email/password auth with sign-up tab.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, HeartPulse, Shield, UserRound, Zap, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { isDemoMode } from "@/lib/supabase";

type Tab = "signin" | "signup";

const DEMO_USERS = [
  {
    label: "Admin",
    icon: Shield,
    email: "admin@hospital.com",
    password: "admin123",
    description: "Full control room — simulation, overrides, inject patients",
    color: "text-accent border-accent/30 bg-accent/5",
    dot: "bg-accent",
  },
  {
    label: "Patient",
    icon: HeartPulse,
    email: "patient@hospital.com",
    password: "patient123",
    description: "Live read-only view — queue, ICU, ambulances, activity",
    color: "text-serious border-serious/30 bg-serious/5",
    dot: "bg-serious",
  },
] as const;

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

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setTab("signin");
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = tab === "signin"
      ? await login(email, password)
      : await register(email, password, displayName);
    setSubmitting(false);
    if (success) navigate("/");
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
      {/* ── Left hero panel ─────────────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-panel lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.10),transparent_50%)]" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-command shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink">EmergencySim</h1>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted">Hospital Command Center</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="max-w-md text-4xl font-bold tracking-tight text-ink leading-tight">
              Real-time emergency operations, managed by role.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
              Admins operate the scenario by hand. Patients watch the queue, ICU beds, ambulances, and live activity from any device.
            </p>
          </motion.div>
          <div className="grid max-w-lg grid-cols-2 gap-4">
            <Feature icon={Shield} title="Admin control" text="Register patients, manage staff, dispatch ambulances." />
            <Feature icon={HeartPulse} title="Patient view" text="Watch live — ICU, queue, and admin activity." />
          </div>
        </div>

        {isDemoMode ? (
          <p className="relative text-xs text-accent/70 font-medium">
            🎭 Demo mode active — no Supabase required
          </p>
        ) : (
          <p className="relative text-xs text-muted">Sign up as patient instantly. Admins are promoted via Supabase dashboard.</p>
        )}
      </div>

      {/* ── Right auth panel ────────────────────────────────── */}
      <div className="flex items-center justify-center bg-command p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-ink">
              {tab === "signin" ? "Sign in" : "Create account"}
            </h2>
            <p className="text-sm text-muted">
              {isDemoMode
                ? "Demo mode — choose a role below to fill credentials instantly."
                : tab === "signin"
                  ? "Enter your credentials to access the portal."
                  : "Sign up to watch live simulations as a patient."}
            </p>
          </div>

          {/* ── DEMO credential cards ──────────────────────── */}
          {isDemoMode && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                🎭 Demo Accounts — click to fill
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.label}
                    type="button"
                    onClick={() => fillDemo(user.email, user.password)}
                    className={`group relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${user.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${user.dot}`} />
                        <span className="text-sm font-bold">{user.label}</span>
                      </div>
                      <Zap className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-70">{user.description}</p>
                    <div className="mt-1 rounded-lg bg-command/60 px-2 py-1.5 font-mono text-[10px] opacity-80">
                      {user.email}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab switcher (Supabase mode only) ──────────── */}
          {!isDemoMode && (
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-panel p-1">
              <RoleTab active={tab === "signin"} onClick={() => switchTab("signin")} icon={UserRound} label="Sign In" />
              <RoleTab active={tab === "signup"} onClick={() => switchTab("signup")} icon={HeartPulse} label="Sign Up" />
            </div>
          )}

          {/* ── Auth form ───────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-panel p-6">
            <AnimatePresence mode="wait">
              {!isDemoMode && tab === "signup" && (
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
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={isDemoMode ? "Click a role card above ↑" : "you@example.com"}
              />
            </label>

            <label className="block space-y-2">
              <span className="micro-label">Password</span>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
                minLength={6}
              />
            </label>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical"
              >
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
                isDemoMode ? "Enter Demo" : tab === "signin" ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          {isDemoMode && (
            <p className="text-center text-xs text-muted leading-relaxed">
              Multi-device sync is disabled in demo mode.{" "}
              <span className="text-ink">Configure Supabase in <code className="text-accent">.env</code> to enable it.</span>
            </p>
          )}

          {!isDemoMode && tab === "signup" && (
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
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
        active ? "bg-accent text-command" : "text-muted hover:bg-elevated/50 hover:text-ink"
      }`}
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
