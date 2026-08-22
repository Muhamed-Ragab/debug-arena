import { useState } from "react";
import {
  Laptop,
  Smartphone,
  Tablet,
  MapPin,
  ShieldAlert,
  LogOut,
  Check,
  AlertTriangle,
} from "lucide-react";
import type { DeviceType, SessionData } from "../data/settings";
import { SESSIONS } from "../data/settings";

const DEVICE_ICON: Record<DeviceType, typeof Laptop> = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
};

export default function SessionManager() {
  const [sessions, setSessions] = useState<SessionData[]>(SESSIONS);

  const otherSessions = sessions.filter((s) => !s.current);
  const hasOthers = otherSessions.length > 0;

  const revoke = (id: string) =>
    setSessions((prev) => prev.filter((s) => s.id !== id));

  const revokeAllOthers = () =>
    setSessions((prev) => prev.filter((s) => s.current));

  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-heading">Active sessions</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Devices signed in to your account. Revoke anything you don&apos;t recognize.
          </p>
        </div>
        <button
          type="button"
          onClick={revokeAllOthers}
          disabled={!hasOthers}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <LogOut size={14} />
          Revoke all other sessions
        </button>
      </div>

      <ul className="mt-5 divide-y divide-border/70">
        {sessions.map((s) => {
          const Icon = DEVICE_ICON[s.deviceType];
          return (
            <li
              key={s.id}
              className={`flex items-center gap-4 py-4 ${
                s.newLogin ? "rounded-md bg-warning/5 px-3 -mx-3" : ""
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-inset text-muted-foreground">
                <Icon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground">
                    {s.device}
                  </span>
                  {s.current && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                      <Check size={11} /> This device
                    </span>
                  )}
                  {s.newLogin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                      <AlertTriangle size={11} /> New login
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {s.browser} · {s.os}
                </p>
                <p className="mt-1 flex items-center gap-3 text-[12px] text-muted-foreground/70">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {s.location}
                  </span>
                  <span className="font-mono">{s.ip}</span>
                  <span>·</span>
                  <span>{s.lastActive}</span>
                </p>
              </div>

              {!s.current && (
                <button
                  type="button"
                  onClick={() => revoke(s.id)}
                  className="shrink-0 rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-danger-soft transition-colors hover:border-danger/40 hover:bg-danger/10"
                >
                  Revoke
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-start gap-2 rounded-md border border-border bg-inset px-3 py-2.5 text-[12px] text-muted-foreground">
        <ShieldAlert size={14} className="mt-0.5 shrink-0 text-primary" />
        <span>
          New-login events are flagged here so you can spot unexpected sessions. We never
          notify via the same channel an attacker could control.
        </span>
      </div>
    </section>
  );
}
