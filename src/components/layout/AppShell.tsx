"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const t = useTranslations();
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
        <Button
          aria-label={t("common.a11y.closeNavigation")}
          className="fixed inset-0 z-40 h-auto w-auto rounded-none bg-black/60 p-0 backdrop-blur-sm lg:hidden"
          onClick={() => setNavOpen(false)}
          type="button"
          variant="ghost"
        />
      )}

      <main className="flex h-full flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
