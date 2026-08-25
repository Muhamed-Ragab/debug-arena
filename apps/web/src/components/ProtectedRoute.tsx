import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function ProtectedRoute() {
  const { data, isPending } = authClient.useSession();
  const location = useLocation();

  if (isPending) return null; // session bootstrap; AppShell renders after
  if (!data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
