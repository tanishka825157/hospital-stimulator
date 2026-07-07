/**
 * RequireRole — route guard component.
 *
 * Wraps any route and redirects the user if they don't have the required role.
 * Uses server-fetched role from Supabase profiles table — not client-editable.
 *
 * Usage:
 *   <RequireRole role="admin"><AdminDashboard /></RequireRole>
 *   <RequireRole role="patient"><WatchDashboard /></RequireRole>
 */
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import type { Role } from "@/lib/auth";

interface RequireRoleProps {
  role: Role;
  children: React.ReactNode;
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);

  // Still fetching initial session from Supabase — show a spinner
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-command">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
          <p className="text-xs font-medium text-muted">Verifying session…</p>
        </div>
      </div>
    );
  }

  // Not logged in at all — go to login
  if (!profile) return <Navigate to="/login" replace />;

  // Logged in but wrong role — redirect to their correct portal
  if (profile.role !== role) {
    return <Navigate to={profile.role === "admin" ? "/admin" : "/watch"} replace />;
  }

  return <>{children}</>;
}
