"use client";

import {
  AlertTriangle,
  Check,
  Laptop,
  LogOut,
  MapPin,
  ShieldAlert,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { revokeAllOtherSessionsAction, revokeSessionAction } from "../actions";
import type { DeviceType, SessionData } from "../types";

const DEVICE_ICON: Record<DeviceType, typeof Laptop> = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
};

interface SessionManagerProps {
  sessions: SessionData[];
}

export function SessionManager({
  sessions: initialSessions,
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionData[]>(initialSessions);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const otherSessions = sessions.filter((s) => !s.current);
  const hasOthers = otherSessions.length > 0;

  const revoke = async (id: string) => {
    setIsRevoking(id);
    try {
      await revokeSessionAction({ sessionId: id });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.warn("Failed to revoke session:", err);
    } finally {
      setIsRevoking(null);
    }
  };

  const revokeAllOthers = async () => {
    setIsRevoking("all");
    try {
      await revokeAllOtherSessionsAction();
      setSessions((prev) => prev.filter((s) => s.current));
    } catch (err) {
      console.warn("Failed to revoke all other sessions:", err);
    } finally {
      setIsRevoking(null);
    }
  };

  return (
    <Card className="p-1">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">Active sessions</CardTitle>
              <SignOutButton />
            </div>
            <CardDescription className="mt-1">
              Devices signed in to your account. Revoke anything you don&apos;t
              recognize.
            </CardDescription>
          </div>
          <Button
            disabled={!hasOthers || isRevoking === "all"}
            onClick={revokeAllOthers}
            size="sm"
            variant="outline"
          >
            <LogOut size={14} />
            {isRevoking === "all" ? "Revoking..." : "Revoke all other sessions"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="divide-y divide-border">
          {sessions.map((s) => {
            const Icon = DEVICE_ICON[s.deviceType] || Laptop;
            const loading = isRevoking === s.id;

            return (
              <li
                className={`flex items-center gap-4 py-4 ${
                  s.newLogin ? "-mx-3 rounded-md bg-amber-500/5 px-3" : ""
                }`}
                key={s.id}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-inset text-muted-foreground">
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[13px] text-foreground">
                      {s.device}
                    </span>
                    {Boolean(s.current) && (
                      <Badge
                        className="gap-1 font-medium text-[11px]"
                        variant="success"
                      >
                        <Check size={11} /> This device
                      </Badge>
                    )}
                    {Boolean(s.newLogin) && (
                      <Badge
                        className="gap-1 font-medium text-[11px]"
                        variant="warning"
                      >
                        <AlertTriangle size={11} /> New login
                      </Badge>
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

                {s.current ? null : (
                  <Button
                    disabled={loading}
                    onClick={() => revoke(s.id)}
                    size="sm"
                    variant="destructive"
                  >
                    {loading ? "Revoking..." : "Revoke"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-start gap-2 rounded-md border border-border bg-inset px-3 py-2.5 text-[12px] text-muted-foreground">
          <ShieldAlert className="mt-0.5 shrink-0 text-primary" size={14} />
          <span>
            New-login events are flagged here so you can spot unexpected
            sessions. We never notify via the same channel an attacker could
            control.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
