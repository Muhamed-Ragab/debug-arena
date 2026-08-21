import { Bell } from "lucide-react";
import { Logo } from "./Sidebar";

export interface Crumb {
  label: string;
  to?: string;
}

interface TopBarProps {
  crumbs: Crumb[];
  right?: React.ReactNode;
}

export default function TopBar({ crumbs, right }: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-4">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground">/</span>}
              <span
                className={
                  i === crumbs.length - 1
                    ? "font-medium text-heading"
                    : "text-muted-foreground"
                }
              >
                {c.label}
              </span>
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {right}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
            MR
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-heading">Marcus Reyes</p>
            <p className="text-xs text-muted-foreground">Senior Engineer</p>
          </div>
        </div>
      </div>
    </header>
  );
}
