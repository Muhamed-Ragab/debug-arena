"use client";

import { useLingui } from "@lingui/react";
import type { Route } from "next";
import Link from "next/link";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useSession } from "@/lib/auth/client";
import { Logo } from "./Sidebar";

export interface Crumb {
  label: string;
  to?: Route;
}

interface TopBarProps {
  crumbs: Crumb[];
  right?: React.ReactNode;
}

export function TopBar({ crumbs, right }: TopBarProps) {
  const { i18n } = useLingui();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "Marcus Reyes";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-border border-b bg-surface px-6">
      <div className="flex items-center gap-4">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          {crumbs.map((c, i) => (
            <span className="flex items-center gap-2" key={c.to ?? c.label}>
              {i > 0 && <span className="text-muted-foreground">/</span>}
              {c.to ? (
                <Link
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  href={c.to}
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  className={
                    i === crumbs.length - 1
                      ? "font-medium text-heading"
                      : "text-muted-foreground"
                  }
                >
                  {c.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {right}
        <NotificationBell />
        <Link
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          href="/profile"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-semibold text-primary text-sm">
            {userInitials}
          </div>
          <div className="text-start leading-tight">
            <p className="font-medium text-heading text-sm">{userName}</p>
            <p className="text-muted-foreground text-xs">
              {i18n._("Senior Engineer")}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
