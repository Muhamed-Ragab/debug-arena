import { useLingui } from "@lingui/react";
import { Logo } from "./Sidebar";
import NotificationBell from "../ui/NotificationBell";

export interface Crumb {
  label: string;
  to?: string;
}

interface TopBarProps {
  crumbs: Crumb[];
  right?: React.ReactNode;
}

export default function TopBar({ crumbs, right }: TopBarProps) {
  const { i18n } = useLingui();
  
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
        <NotificationBell />
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
            MR
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-heading">Marcus Reyes</p>
            <p className="text-xs text-muted-foreground">{i18n._("Senior Engineer")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
