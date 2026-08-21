import { NavLink } from "react-router-dom";
import { LayoutGrid, Trophy, User, Bug } from "lucide-react";

const NAV = [
  { to: "/", label: "Challenges", icon: LayoutGrid, end: true },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy, end: false },
  { to: "/profile", label: "Profile", icon: User, end: false },
];

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

export default function Sidebar() {
  return (
    <aside
      className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-surface"
    >
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <div className="px-3 pt-2">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Navigation
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
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-primary" />
                  )}
                  <Icon size={18} className={isActive ? "text-primary" : ""} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-3">
        <div className="rounded-lg border border-border bg-inset p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Your Rank
          </p>
          <p className="mt-1 text-2xl font-semibold text-heading">#128</p>
          <p className="mt-1 text-xs text-muted-foreground">
            4,820 pts · 12-day streak
          </p>
        </div>
      </div>
    </aside>
  );
}
