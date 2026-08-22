import { NavLink } from "react-router-dom";
import { LayoutGrid, Trophy, User, Bug, Settings, X } from "lucide-react";
import { useLingui } from "@lingui/react";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageSwitcher } from "../LanguageSwitcher";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Bug size={18} className="text-white" />
      </div>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-heading">
          Debug Arena
        </span>
      )}
    </div>
  );
}

export default function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const { i18n } = useLingui();
  
  const NAV = [
    { to: "/challenges", label: i18n._("Challenges"), icon: LayoutGrid, end: false },
    { to: "/leaderboard", label: i18n._("Leaderboard"), icon: Trophy, end: false },
    { to: "/profile", label: i18n._("Profile"), icon: User, end: false },
    { to: "/settings", label: i18n._("Settings"), icon: Settings, end: false },
  ];
  return (
    <aside
      className={`flex h-full w-[260px] shrink-0 flex-col border-e border-border bg-surface absolute inset-y-0 z-50 transition-transform duration-300 lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "max-lg:-translate-x-full max-lg:rtl:translate-x-full"
      }`}
    >
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        {onClose && (
          <button onClick={onClose} className="lg:hidden">
            <X size={20} className="text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="px-3 pt-2">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {i18n._("Navigation")}
        </p>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/[0.04] text-heading"
                    : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute start-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-e bg-primary" />
                  )}
                  <Icon size={18} className={isActive ? "text-primary" : ""} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-border p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{i18n._("Theme")}</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{i18n._("Language")}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </aside>
  );
}
