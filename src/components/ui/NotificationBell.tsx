"use client";

import { Award, Bell, CheckCircle2, Info, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type NotificationType =
  | "challenge"
  | "streak"
  | "system"
  | "achievement";

export interface NotificationItem {
  description: string;
  id: string;
  read: boolean;
  time: string;
  title: string;
  type: NotificationType;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    description: "You've fixed 7 bugs in a row without a failed attempt.",
    id: "n-1",
    read: false,
    time: "5m ago",
    title: "7-Day Streak Active",
    type: "streak",
  },
  {
    description: "New 'Race Condition in Order Flow' challenge is live.",
    id: "n-2",
    read: false,
    time: "1h ago",
    title: "New Hard Challenge",
    type: "challenge",
  },
  {
    description: "Top 3 position unlocked on the global leaderboard.",
    id: "n-3",
    read: true,
    time: "2d ago",
    title: "Podium Reached",
    type: "achievement",
  },
];

const ICONS: Record<NotificationType, typeof Bell> = {
  achievement: Award,
  challenge: Sparkles,
  streak: CheckCircle2,
  system: Info,
};

const ACCENT: Record<NotificationType, string> = {
  achievement: "#fbbf24",
  challenge: "#6366f1",
  streak: "#22c55e",
  system: "#38bdf8",
};

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const el = ref.current as HTMLElement | null;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
        )}
      </button>

      {Boolean(open) && (
        <div
          className="absolute end-0 top-full z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          role="menu"
          tabIndex={-1}
        >
          <div className="flex items-center justify-between border-border border-b px-4 py-3">
            <p className="font-semibold text-heading text-sm">Notifications</p>
            {unread > 0 && (
              <button
                className="font-medium text-primary text-xs transition-colors hover:text-primary/80"
                onClick={markAllRead}
                type="button"
              >
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-[360px] overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-muted-foreground text-sm">
                You're all caught up.
              </li>
            )}
            {items.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <li
                  className={cn(
                    "flex gap-3 border-border/60 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-white/[0.02]",
                    !n.read && "bg-white/[0.03]"
                  )}
                  key={n.id}
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
                      <p className="truncate font-medium text-heading text-sm">
                        {n.title}
                      </p>
                      {n.read ? null : (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-muted-foreground text-xs leading-snug">
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
