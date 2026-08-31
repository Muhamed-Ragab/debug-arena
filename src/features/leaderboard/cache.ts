import { getRedis } from "@/lib/redis";
import type { LeaderboardEntry } from "./types";

const LEADERBOARD_CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds

export function getLeaderboardCacheKey(
  period: string,
  categorySlug?: string | null
): string {
  return `leaderboard:v3:top:24h:${period}:${categorySlug || "all"}`;
}

export async function getCachedLeaderboard(
  key: string
): Promise<LeaderboardEntry[] | null> {
  try {
    const redis = getRedis();
    const data = await redis.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as LeaderboardEntry[];
  } catch (err) {
    console.warn("[LeaderboardCache] Failed to get from Redis cache:", err);
    return null;
  }
}

export async function setCachedLeaderboard(
  key: string,
  entries: LeaderboardEntry[],
  ttlSeconds: number = LEADERBOARD_CACHE_TTL
): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(entries), "EX", ttlSeconds);
  } catch (err) {
    console.warn("[LeaderboardCache] Failed to write to Redis cache:", err);
  }
}

export async function invalidateLeaderboardCache(
  pattern = "leaderboard:v3:top:24h:*"
): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    // also clear legacy v2 + base keys for migration
    const v2Keys = await redis.keys("leaderboard:v2:top:24h:*");
    const legacy = await redis.keys("leaderboard:top:24h:*");
    const allKeys = [...keys, ...v2Keys, ...legacy];
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }
  } catch (err) {
    console.warn("[LeaderboardCache] Failed to invalidate Redis cache:", err);
  }
}
