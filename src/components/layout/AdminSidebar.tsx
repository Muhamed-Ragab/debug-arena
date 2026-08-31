"use client";

import {
  Activity,
  BarChart3,
  FolderTree,
  LayoutDashboard,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExtracted } from "next-intl";
import { LanguageSwitcher } from "@/components/preferences/LanguageSwitcher";
import { ThemeToggle } from "@/components/preferences/ThemeToggle";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

export function AdminSidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const t = useExtracted();
  const pathname = usePathname();

  const NAV: Array<{
    to: Route;
    label: string;
    icon: typeof LayoutDashboard;
  }> = [
    {
      icon: LayoutDashboard,
      label: t("Dashboard"),
      to: "/admin" as Route,
    },
    {
      icon: FolderTree,
      label: t("Categories"),
      to: "/admin/categories" as Route,
    },
    {
      icon: Sparkles,
      label: t("AI Question Studio"),
      to: "/admin/questions" as Route,
    },
    {
      icon: Activity,
      label: t("Health Check"),
      to: "/admin/health" as Route,
    },
    {
      icon: BarChart3,
      label: t("Analytics"),
      to: "/admin/analytics" as Route,
    },
    {
      icon: Users,
      label: t("Users"),
      to: "/admin/users" as Route,
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
        <Logo href={"/admin" as Route} />
        {Boolean(onClose) && (
          <Button
            aria-label={t("Close sidebar")}
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
          {t("Admin Portal")}
        </p>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const isActive =
              (to as string) === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(to as string);
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
      </div>

      <div className="mt-auto border-border border-t p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              {t("Theme")}
            </span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-sm">
              {t("Language")}
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
