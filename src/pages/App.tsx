/**
 * App — root router.
 *
 * Role-based routing:
 *   /login       → LoginPage (unauthenticated)
 *   /admin/*     → AdminDashboard, guarded by RequireRole("admin")
 *   /watch/*     → WatchDashboard, guarded by RequireRole("patient")
 *   /            → RootRedirect (sends user to their role's portal)
 *   *            → RootRedirect (catch-all)
 */
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginPage } from "@/pages/LoginPage";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { WatchDashboard } from "@/pages/WatchDashboard";
import { RequireRole } from "@/components/auth/RequireRole";

function RootRedirect() {
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-command">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;
  return <Navigate to={profile.role === "admin" ? "/admin" : "/watch"} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/*"
          element={
            <RequireRole role="admin">
              <AdminDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/watch/*"
          element={
            <RequireRole role="patient">
              <WatchDashboard />
            </RequireRole>
          }
        />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
