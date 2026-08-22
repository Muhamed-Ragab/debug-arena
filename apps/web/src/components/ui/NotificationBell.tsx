import { useEffect, useRef, useState } from "react";
import { Bell, Bug, Info, Trophy, UserPlus } from "lucide-react";
import { cn } from "../../lib/utils";

export type NotificationType = "achievement" | "challenge" | "social" | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    type: "achievement",
    title: "New badge: Bug Slayer",
    description: "You solved 10 concurrency challenges in a row.",
    time: "2m ago",
    read: false,
  },
  {
    id: "n2",
    type: "challenge",
    title: "Challenge ready for review",
    description: "“Race Condition in Checkout” was graded — 92/100.",
    time: "1h ago",
    read: false,
  },
  {
    id: "n3",
    type: "social",
    title: "Marcus Reyes followed you",
    description: "You now share a leaderboard with Marcus.",
    time: "3h ago",
    read: false,
  },
  {
    id: "n4",
    type: "system",
    title: "Weekly streak secured",
    description: "12-day streak — keep it going tomorrow.",
    time: "Yesterday",
    read: true,
  },
];

const ICONS: Record<NotificationType, typeof Bell> = {
  achievement: Trophy,
  challenge: Bug,
  social: UserPlus,
  system: Info,
};

const ACCENT: Record<NotificationType, string> = {
  achievement: "#F59E0B",
  challenge: "#818CF8",
  social: "#22D3EE",
  system: "#A3A3A3",
};

interface NotificationBellProps {
  notifications?: AppNotification[];
  className?: string;
}

export default function NotificationBell({
  notifications = MOCK_NOTIFICATIONS,
  className,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(notifications);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-heading">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-[360px] overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                You're all caught up.
              </li>
            )}
            {items.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <li
                  key={n.id}
                  className={cn(
                    "flex gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 transition-colors hover:bg-white/[0.02]",
                    !n.read && "bg-white/[0.03]"
                  )}
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: `${ACCENT[n.type]}1f`,
                      color: ACCENT[n.type],
                    }}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-heading">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {n.description}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-600">{n.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
