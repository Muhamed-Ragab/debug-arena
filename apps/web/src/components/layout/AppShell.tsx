import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export interface AppShellContext {
  onMenuClick: () => void;
}

export default function AppShell() {
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const withSidebar =
    !(pathname.startsWith("/challenges/") && pathname !== "/challenges/") &&
    !pathname.startsWith("/submissions");

  if (!withSidebar) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
        <Outlet context={{ onMenuClick: () => setNavOpen(true) } satisfies AppShellContext} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <main className="flex h-full flex-1 flex-col overflow-hidden">
        <Outlet context={{ onMenuClick: () => setNavOpen(true) } satisfies AppShellContext} />
      </main>
    </div>
  );
}
