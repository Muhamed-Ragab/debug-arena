import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppShell() {
  const { pathname } = useLocation();
  const withSidebar =
    !pathname.startsWith("/challenges/") &&
    !pathname.startsWith("/submissions/");

  if (!withSidebar) {
    return (
      <div className="dark flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="dark flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex h-full flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
