import { NextResponse } from "next/server";
import { checkDbHealth } from "@/db/health";
import { OFFLINE_MESSAGE } from "@/lib/offline";
import { checkRedisHealth } from "@/lib/redis/health";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HealthCheckResult {
  error?: string;
  latencyMs: number;
  ok: boolean;
}

interface HealthChecks {
  db: HealthCheckResult;
  redis: HealthCheckResult;
}

interface HealthData {
  checks: HealthChecks;
  status: "ok" | "degraded";
  timestamp: string;
  uptime: number;
}

interface HealthEnvelope {
  data: HealthData;
  error: string | null;
  success: boolean;
}

function toHealthCheck(
  result: PromiseSettledResult<HealthCheckResult>
): HealthCheckResult {
  if (result.status === "fulfilled") {
    return result.value;
  }
  const { reason } = result;
  const message =
    reason instanceof Error
      ? reason.message
      : String(reason ?? "Unknown error");
  // checkDbHealth/checkRedisHealth already measure per-check latency;
  // on rejection (should be rare, as they catch internally) provide local latency 0
  return {
    error: message,
    latencyMs: 0,
    ok: false,
  };
}

async function getHealthState(): Promise<{
  ok: boolean;
  envelope: HealthEnvelope;
  statusCode: number;
}> {
  const [dbSettled, redisSettled] = await Promise.allSettled([
    checkDbHealth(2000),
    checkRedisHealth(2000),
  ]);

  const db = toHealthCheck(dbSettled);
  const redis = toHealthCheck(redisSettled);

  const ok = db.ok && redis.ok;
  const statusCode = ok ? 200 : 503;

  const envelope: HealthEnvelope = {
    data: {
      checks: {
        db,
        redis,
      },
      status: ok ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    error: ok ? null : OFFLINE_MESSAGE,
    success: ok,
  };

  return { envelope, ok, statusCode };
}

export async function GET(): Promise<NextResponse<HealthEnvelope>> {
  const { envelope, statusCode } = await getHealthState();
  return NextResponse.json(envelope, { status: statusCode });
}

export async function HEAD(): Promise<Response> {
  const { statusCode } = await getHealthState();
  return new Response(null, { status: statusCode });
}
