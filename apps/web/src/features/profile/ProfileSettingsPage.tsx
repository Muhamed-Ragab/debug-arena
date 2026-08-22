import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Menu, User, MonitorSmartphone, Link2, ShieldAlert } from "lucide-react";
import type { AppShellContext } from "../../components/layout/AppShell";
import EditProfileForm from "./components/EditProfileForm";
import SessionManager from "./components/SessionManager";
import LinkedAccounts from "./components/LinkedAccounts";
import DangerZone from "./components/DangerZone";

type SectionId = "profile" | "sessions" | "accounts" | "danger";

const SECTIONS: { id: SectionId; label: string; icon: typeof User; danger?: boolean }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "sessions", label: "Sessions", icon: MonitorSmartphone },
  { id: "accounts", label: "Connected Accounts", icon: Link2 },
  { id: "danger", label: "Danger Zone", icon: ShieldAlert, danger: true },
];

export default function ProfileSettingsPage() {
  const { onMenuClick } = useOutletContext<AppShellContext>();
  const [active, setActive] = useState<SectionId>("profile");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header
        className="flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-8"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground lg:hidden"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold text-zinc-100">Settings</h1>
          <p className="text-[12px] text-muted-foreground">Manage your account and security</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Section nav */}
        <nav
          className="shrink-0 space-y-1 border-b border-border px-4 py-3 lg:w-[220px] lg:border-b-0 lg:border-e lg:px-3 lg:py-6"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
          aria-label="Settings sections"
        >
          {SECTIONS.map(({ id, label, icon: Icon, danger }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? danger
                      ? "bg-danger/[0.08] text-danger-soft"
                      : "bg-white/[0.04] text-heading"
                    : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                }`}
              >
                {isActive && (
                  <span
                    className={`absolute start-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-e ${
                      danger ? "bg-danger" : "bg-primary"
                    }`}
                  />
                )}
                <Icon size={17} className={isActive && !danger ? "text-primary" : ""} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active section */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-[760px]">
            {active === "profile" && <EditProfileForm />}
            {active === "sessions" && <SessionManager />}
            {active === "accounts" && <LinkedAccounts />}
            {active === "danger" && <DangerZone />}
          </div>
        </main>
      </div>
    </div>
  );
}
