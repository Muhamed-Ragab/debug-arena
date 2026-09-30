"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "./AdminSidebar";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <AdminSidebar onClose={() => setNavOpen(false)} open={navOpen} />

      {Boolean(navOpen) && (
        <Button
          aria-label={"Close navigation"}
          className="fixed inset-0 z-40 h-auto w-auto rounded-none bg-black/60 p-0 backdrop-blur-sm lg:hidden"
          onClick={() => setNavOpen(false)}
          type="button"
          variant="ghost"
        />
      )}

      <main className="flex h-full min-h-0 flex-1 flex-col overflow-auto">
        {children}
      </main>
    </div>
  );
}
