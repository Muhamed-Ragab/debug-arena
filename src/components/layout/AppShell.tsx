"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  // Challenges workspace full-bleed view check
  const isFullBleedWorkspace =
    pathname.startsWith("/challenges/") &&
    pathname !== "/challenges" &&
    !pathname.endsWith("/results");

  if (isFullBleedWorkspace) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar onClose={() => setNavOpen(false)} open={navOpen} />

      {Boolean(navOpen) && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setNavOpen(false)}
          type="button"
        />
      )}

      <main className="flex h-full flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
