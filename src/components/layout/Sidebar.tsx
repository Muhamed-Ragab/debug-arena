"use client";

import {
  Bug,
  FolderTree,
  LayoutGrid,
  Settings,
  Sparkles,
  Trophy,
  User,
  X,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/preferences/LanguageSwitcher";
import { ThemeToggle } from "@/components/preferences/ThemeToggle";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="flex items-center gap-2.5" href="/challenges">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Bug className="text-primary-foreground" size={18} />
      </div>
      {!compact && (
        <span className="font-semibold text-[15px] text-heading tracking-tight">
          Debug Arena
        </span>
      )}
    </Link>
  );
}

export function Sidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as { role?: string } | undefined;
  const isAdmin = user?.role === "admin";

  const NAV: Array<{
    to: Route;
    label: string;
    icon: typeof LayoutGrid;
  }> = [
    {
      icon: LayoutGrid,
      label: t("common.navigation.challenges"),
      to: "/challenges",
    },
    {
      icon: Trophy,
      label: t("common.navigation.leaderboard"),
      to: "/leaderboard",
    },
    { icon: User, label: t("common.navigation.profile"), to: "/profile" },
    { icon: Settings, label: t("common.settings"), to: "/settings" },
  ];

  const ADMIN_NAV: Array<{
    to: Route;
    label: string;
    icon: typeof Sparkles;
  }> = [
    {
      icon: Sparkles,
      label: t("common.ai_question_studio"),
      to: "/admin/questions" as Route,
    },
    {
      icon: FolderTree,
      label: t("common.navigation.categories"),
      to: "/admin/categories" as Route,
    },
  ];

  return (
    <aside
      className={cn(
        "absolute inset-y-0 z-50 flex h-full w-65 shrink-0 flex-col border-border border-e bg-surface transition-transform duration-300 lg:static lg:translate-x-0",
        open
          ? "translate-x-0"
          : "max-lg:-translate-x-full max-lg:rtl:translate-x-full"
      )}
    >
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        {Boolean(onClose) && (
          <Button
            aria-label="Close sidebar"
            className="h-8 w-8 p-0 lg:hidden"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="text-muted-foreground" size={20} />
          </Button>
        )}
      </div>

      <div className="px-3 pt-2">
        <p className="px-3 pb-2 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
          {t("common.navigation.navigation")}
        </p>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const isActive =
              to === "/challenges"
                ? pathname.startsWith("/challenges")
                : pathname === to;
            return (
              <Link
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2.5 font-medium text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-semibold text-heading"
                    : "text-muted-foreground hover:bg-inset hover:text-foreground"
                )}
                href={to}
                key={to}
                onClick={onClose}
              >
                {Boolean(isActive) && (
                  <span className="absolute inset-s-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-e bg-primary" />
                )}
                <Icon className={isActive ? "text-primary" : ""} size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {Boolean(isAdmin) && (
          <div className="mt-6">
            <p className="px-3 pb-2 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
              {t("common.navigation.adminPortal")}
            </p>
            <nav className="flex flex-col gap-1">
              {ADMIN_NAV.map(({ to, label, icon: Icon }) => {
                const isActive = pathname.startsWith(to);
                return (
                  <Link
                    className={cn(
                      "relative flex items-center gap-3 rounded-md px-3 py-2.5 font-medium text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 font-semibold text-heading"
                        : "text-muted-foreground hover:bg-inset hover:text-foreground"
                    )}
                    href={to}
                    key={to}
                    onClick={onClose}
                  >
                    {Boolean(isActive) && (
                      <span className="absolute inset-s-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-e bg-primary" />
                    )}
                    <Icon
                      className={isActive ? "text-primary" : "text-primary/70"}
                      size={18}
                    />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="mt-auto border-border border-t p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              {t("common.preferences.theme")}
            </span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              {t("common.preferences.language")}
            </span>
            <LanguageSwitcher />
          </div>
          <div className="pt-1">
            <SignOutButton
              className="w-full justify-start px-2 py-2 text-sm"
              size="sm"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
