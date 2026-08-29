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
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
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
import { flattenValidationErrors } from "@/lib/safe-action/validation";
import { cn } from "@/lib/utils";
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
  const t = useTranslations();
  const [sessions, setSessions] = useState<SessionData[]>(initialSessions);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const otherSessions = sessions.filter((s) => !s.current);
  const hasOthers = otherSessions.length > 0;

  const revoke = async (id: string) => {
    setIsRevoking(id);
    try {
      const res = await revokeSessionAction({ sessionId: id });
      if (res?.validationErrors) {
        const flat = flattenValidationErrors(res.validationErrors);
        toast.error(
          t(
            (flat.sessionId ??
              flat._errors ??
              "error.validationFailed") as string
          )
        );
        return;
      }
      if (res?.serverError) {
        toast.error(t(res.serverError as string));
        return;
      }
      if (res?.data?.success) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        toast.success(t("profile.session.revoked"));
      }
    } catch {
      toast.error(t("error.somethingWrong"));
    } finally {
      setIsRevoking(null);
    }
  };

  const revokeAllOthers = async () => {
    setIsRevoking("all");
    try {
      const res = await revokeAllOtherSessionsAction({});
      if (res?.validationErrors) {
        const flat = flattenValidationErrors(res.validationErrors);
        toast.error(t((flat._errors ?? "error.validationFailed") as string));
        return;
      }
      if (res?.serverError) {
        toast.error(t(res.serverError as string));
        return;
      }
      if (res?.data?.success) {
        setSessions((prev) => prev.filter((s) => s.current));
        toast.success(t("profile.session.othersRevoked"));
      }
    } catch {
      toast.error(t("error.somethingWrong"));
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
              <CardTitle className="text-base">
                {t("profile.session.title")}
              </CardTitle>
              <SignOutButton />
            </div>
            <CardDescription className="mt-1">
              {t("profile.session.subtitle")}
            </CardDescription>
          </div>
          <Button
            disabled={!hasOthers || isRevoking === "all"}
            onClick={revokeAllOthers}
            size="sm"
            variant="outline"
          >
            <LogOut size={14} />
            {isRevoking === "all"
              ? t("profile.session.revoking")
              : t("profile.session.revokeAll")}
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
                className={cn(
                  "flex items-center gap-4 py-4",
                  s.newLogin && "-mx-3 rounded-md bg-amber-500/5 px-3"
                )}
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
                        <Check size={11} /> {t("profile.session.thisDevice")}
                      </Badge>
                    )}
                    {Boolean(s.newLogin) && (
                      <Badge
                        className="gap-1 font-medium text-[11px]"
                        variant="warning"
                      >
                        <AlertTriangle size={11} />{" "}
                        {t("profile.session.newLogin")}
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
                    {loading
                      ? t("profile.session.revoking")
                      : t("profile.session.revoke")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-start gap-2 rounded-md border border-border bg-inset px-3 py-2.5 text-[12px] text-muted-foreground">
          <ShieldAlert className="mt-0.5 shrink-0 text-primary" size={14} />
          <span>{t("profile.session.securityHint")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
