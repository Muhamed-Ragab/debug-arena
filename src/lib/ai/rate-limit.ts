import { getRedis } from "@/lib/redis";

export interface RateLimitResult {
  allowed: boolean;
  errorReason?: string;
  remaining: number;
  resetInSeconds: number;
}

export interface DailyQuotaResult {
  isByok: boolean;
  total: number;
  used: number;
}

export const PLATFORM_RPM_LIMIT = 5;
export const PLATFORM_DAILY_QUOTA = 15;
export const BYOK_RPM_LIMIT = 30;

function getSecondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    )
  );
  return Math.max(1, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

/**
 * Checks and increments AI submission rate limits and daily quotas.
 * - Platform: 5 RPM, 15 daily evaluations
 * - BYOK: 30 RPM, unmetered daily evaluations
 * Degrades gracefully (fails open) if Redis is unreachable.
 */
export async function checkAIRateLimit(
  userId: string,
  isByok: boolean
): Promise<RateLimitResult> {
  try {
    const redis = getRedis();
    const dateStr = new Date().toISOString().slice(0, 10);
    const dailyKey = `ai:quota:daily:${userId}:${dateStr}`;
    const rpmKey = `ai:ratelimit:rpm:${userId}`;

    // 1. Check daily quota for platform users
    if (!isByok) {
      const dailyUsedStr = await redis.get(dailyKey);
      const dailyUsed = dailyUsedStr ? Number.parseInt(dailyUsedStr, 10) : 0;
      if (dailyUsed >= PLATFORM_DAILY_QUOTA) {
        return {
          allowed: false,
          errorReason: `Daily AI evaluation quota reached (${PLATFORM_DAILY_QUOTA}/${PLATFORM_DAILY_QUOTA}). Add your own API key in Settings for unlimited evaluations.`,
          remaining: 0,
          resetInSeconds: getSecondsUntilMidnightUTC(),
        };
      }
    }

    // 2. Check sliding RPM limit
    const limit = isByok ? BYOK_RPM_LIMIT : PLATFORM_RPM_LIMIT;
    const rpmCount = await redis.incr(rpmKey);
    if (rpmCount === 1) {
      await redis.expire(rpmKey, 60);
    }
    const ttl = await redis.ttl(rpmKey);
    const resetInSeconds = ttl > 0 ? ttl : 60;

    if (rpmCount > limit) {
      const reason = isByok
        ? `BYOK rate limit exceeded (${BYOK_RPM_LIMIT} requests/minute). Please wait before trying again.`
        : `Platform rate limit exceeded (${PLATFORM_RPM_LIMIT} requests/minute). Please wait before trying again.`;
      return {
        allowed: false,
        errorReason: reason,
        remaining: 0,
        resetInSeconds,
      };
    }

    // 3. Increment daily usage counter for platform requests
    if (!isByok) {
      const dailyCount = await redis.incr(dailyKey);
      if (dailyCount === 1) {
        await redis.expire(dailyKey, 86_400);
      }
    }

    const remaining = Math.max(0, limit - rpmCount);
    return {
      allowed: true,
      remaining,
      resetInSeconds,
    };
  } catch (err) {
    console.warn("[AIRateLimit] Redis unavailable, failing open:", err);
    return {
      allowed: true,
      remaining: 1,
      resetInSeconds: 0,
    };
  }
}

/**
 * Retrieves the user's daily evaluation count and quota limit.
 */
export async function getDailyAIQuota(
  userId: string,
  isByok = false
): Promise<DailyQuotaResult> {
  try {
    const redis = getRedis();
    const dateStr = new Date().toISOString().slice(0, 10);
    const dailyKey = `ai:quota:daily:${userId}:${dateStr}`;
    const usedStr = await redis.get(dailyKey);
    const used = usedStr ? Number.parseInt(usedStr, 10) : 0;

    return {
      isByok,
      total: isByok ? -1 : PLATFORM_DAILY_QUOTA,
      used,
    };
  } catch (err) {
    console.warn(
      "[AIRateLimit] Failed to get daily quota, returning default:",
      err
    );
    return {
      isByok,
      total: isByok ? -1 : PLATFORM_DAILY_QUOTA,
      used: 0,
    };
  }
}
