"use client";

import { useLocale, useExtracted } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

interface HealthCheckResult {
  error?: string;
  latencyMs: number;
  ok: boolean;
}

interface HealthData {
  checks: {
    db: HealthCheckResult;
    redis: HealthCheckResult;
  };
  status: "ok" | "degraded";
  timestamp: string;
  uptime: number;
}

interface HealthEnvelope {
  data: HealthData;
  error: string | null;
  success: boolean;
}

function formatUptime(totalSeconds: number, locale: string): string {
  const nf = new Intl.NumberFormat(locale);
  const d = Math.floor(totalSeconds / 86_400);
  const h = Math.floor((totalSeconds % 86_400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (d > 0) {
    return `${nf.format(d)}d ${nf.format(h)}h ${nf.format(m)}m ${nf.format(s)}s`;
  }
  if (h > 0) {
    return `${nf.format(h)}h ${nf.format(m)}m ${nf.format(s)}s`;
  }
  if (m > 0) {
    return `${nf.format(m)}m ${nf.format(s)}s`;
  }
  return `${nf.format(s)}s`;
}

export function HealthPanel() {
  const t = useExtracted();
  const locale = useLocale();
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "medium",
      }),
    [locale]
  );

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale),
    [locale]
  );

  const fetchHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = (await res.json()) as HealthEnvelope;
      setData(json.data);
      setError(json.error);
      setNow(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch health");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialFetch() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const json = (await res.json()) as HealthEnvelope;
        if (!cancelled) {
          setData(json.data);
          setError(json.error);
          setNow(Date.now());
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch health"
          );
        }
      }
    }
    initialFetch();
    const id = setInterval(() => {
      fetchHealth();
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetchHealth]);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const displayUptime = useMemo(() => {
    if (!data) {
      return 0;
    }
    const elapsedSec = (now - new Date(data.timestamp).getTime()) / 1000;
    return Math.max(0, data.uptime + elapsedSec);
  }, [data, now]);

  const formattedTimestamp = useMemo(() => {
    if (!data) {
      return "";
    }
    return dateFormatter.format(new Date(data.timestamp));
  }, [data, dateFormatter]);

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Loading health...</p>
          <Button
            disabled={isRefreshing}
            onClick={() => {
              fetchHealth();
            }}
            size="sm"
            variant="outline"
          >
            {isRefreshing ? t("Refreshing...") : t("Refresh")}
          </Button>
        </div>
        {error ? (
          <p className="mt-2 text-destructive text-xs">{error}</p>
        ) : null}
      </div>
    );
  }

  const statusLabel = data.status === "ok" ? t("Operational") : t("Degraded");
  const statusColor = data.status === "ok" ? "bg-emerald-500" : "bg-amber-500";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold text-heading">{t("System Health")}</h3>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
            {statusLabel}
          </span>
          <Button
            aria-label={t("Refresh")}
            disabled={isRefreshing}
            onClick={() => {
              fetchHealth();
            }}
            size="sm"
            variant="outline"
          >
            {isRefreshing ? t("Refreshing...") : t("Refresh")}
          </Button>
        </span>
      </div>
      <p className="text-muted-foreground text-sm">
        {t("Live status of database and Redis services.")}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-inset p-4">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {t("Database")}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${data.checks.db.ok ? "bg-emerald-500" : "bg-destructive"}`}
            />
            {data.checks.db.ok ? t("Operational") : t("Degraded")}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {t("Latency")}: {numberFormatter.format(data.checks.db.latencyMs)}ms
          </p>
          {data.checks.db.error ? (
            <p className="mt-1 text-destructive text-xs">
              {data.checks.db.error}
            </p>
          ) : null}
        </div>
        <div className="rounded-lg bg-inset p-4">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {t("Redis")}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${data.checks.redis.ok ? "bg-emerald-500" : "bg-destructive"}`}
            />
            {data.checks.redis.ok ? t("Operational") : t("Degraded")}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {t("Latency")}:{" "}
            {numberFormatter.format(data.checks.redis.latencyMs)}ms
          </p>
          {data.checks.redis.error ? (
            <p className="mt-1 text-destructive text-xs">
              {data.checks.redis.error}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-muted-foreground text-xs">
        <span>
          {t("Uptime")}: {formatUptime(displayUptime, locale)}
        </span>
        <span>
          {t("Checked at")}: {formattedTimestamp}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        {t("Auto-refresh every 30s")}
      </p>
    </div>
  );
}
