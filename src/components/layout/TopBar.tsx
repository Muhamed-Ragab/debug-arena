"use client";

import { useLingui } from "@lingui/react";
import type { Route } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
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

  const user = session?.user as
    | {
        displayName?: string;
        image?: string;
        jobTitle?: string;
        name?: string;
        preferredColor?: string;
      }
    | undefined;

  const userName = user?.displayName || user?.name || "Developer";
  const userJobTitle = user?.jobTitle || i18n._("Developer");

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
        <Link
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          href="/profile"
        >
          <Avatar
            image={user?.image}
            name={userName}
            preferredColor={user?.preferredColor}
            size={36}
          />
          <div className="text-start leading-tight">
            <p className="font-medium text-heading text-sm">{userName}</p>
            <p className="text-muted-foreground text-xs">{userJobTitle}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
