"use client";

import { Link2, MonitorSmartphone, ShieldAlert, User } from "lucide-react";
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";
import { DangerZone } from "./components/DangerZone";
import { EditProfileForm } from "./components/EditProfileForm";
import { LinkedAccounts } from "./components/LinkedAccounts";
import { SessionManager } from "./components/SessionManager";
import type { LinkedAccount, SessionData } from "./types";

type SectionId = "profile" | "sessions" | "accounts" | "danger";

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: typeof User;
  danger?: boolean;
}[] = [
  { icon: User, id: "profile", label: "Profile" },
  { icon: MonitorSmartphone, id: "sessions", label: "Sessions" },
  { icon: Link2, id: "accounts", label: "Connected Accounts" },
  { danger: true, icon: ShieldAlert, id: "danger", label: "Danger Zone" },
];

function getNavClasses(isActive: boolean, danger?: boolean): string {
  if (!isActive) {
    return "text-muted-foreground hover:bg-inset hover:text-foreground";
  }
  if (danger) {
    return "bg-destructive/10 font-semibold text-destructive";
  }
  return "bg-primary/10 font-semibold text-heading";
}

interface ProfileSettingsPageProps {
  initialAccounts?: LinkedAccount[];
  initialProfile?: {
    avatarColor?: string;
    avatarUrl?: string;
    bio?: string;
    displayName?: string;
    handle?: string;
    interests?: string[];
    isPublic?: boolean;
    jobTitle?: string;
  };
  initialSessions?: SessionData[];
}

export function ProfileSettingsPage({
  initialProfile,
  initialAccounts,
  initialSessions,
}: ProfileSettingsPageProps) {
  const [active, setActive] = useState<SectionId>("profile");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar crumbs={[{ label: "Arena" }, { label: "Settings" }]} />

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Section nav */}
        <nav
          aria-label="Settings sections"
          className="shrink-0 space-y-1 border-border border-b bg-surface px-4 py-3 lg:w-55 lg:border-e lg:border-b-0 lg:px-3 lg:py-6"
        >
          {SECTIONS.map(({ id, label, icon: Icon, danger }) => {
            const isActive = active === id;
            return (
              <button
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 font-medium text-[13px] transition-colors",
                  getNavClasses(isActive, danger)
                )}
                key={id}
                onClick={() => setActive(id)}
                type="button"
              >
                {Boolean(isActive) && (
                  <span
                    className={cn(
                      "absolute inset-s-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-e",
                      danger ? "bg-destructive" : "bg-primary"
                    )}
                  />
                )}
                <Icon
                  className={isActive && !danger ? "text-primary" : ""}
                  size={17}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active section */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl">
            {active === "profile" && (
              <EditProfileForm initialProfile={initialProfile} />
            )}
            {active === "sessions" && (
              <SessionManager sessions={initialSessions ?? []} />
            )}
            {active === "accounts" && (
              <LinkedAccounts accounts={initialAccounts ?? []} />
            )}
            {active === "danger" && (
              <DangerZone handle={initialProfile?.handle} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
