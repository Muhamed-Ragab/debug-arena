import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkAIRateLimit, getDailyAIQuota } from "./rate-limit";

// Mock Redis client
const mockRedis = {
  expire: vi.fn(),
  get: vi.fn(),
  incr: vi.fn(),
  ttl: vi.fn(),
};

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(() => mockRedis),
}));

describe("AI Rate Limiter & Usage Quotas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Platform Users (Default)", () => {
    it("allows request when under 5 RPM and under 15 daily evaluations", async () => {
      mockRedis.get.mockResolvedValueOnce("2"); // 2 daily evaluations used
      mockRedis.incr.mockResolvedValueOnce(3); // 3rd request this minute
      mockRedis.ttl.mockResolvedValueOnce(45); // 45 seconds remaining in window
      mockRedis.incr.mockResolvedValueOnce(3); // daily increment

      const result = await checkAIRateLimit("user-1", false);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 5 - 3
      expect(result.resetInSeconds).toBe(45);
      expect(result.errorReason).toBeUndefined();
    });

    it("blocks request when exceeding 5 RPM", async () => {
      mockRedis.get.mockResolvedValueOnce("5"); // 5 daily used
      mockRedis.incr.mockResolvedValueOnce(6); // 6th request this minute
      mockRedis.ttl.mockResolvedValueOnce(30);

      const result = await checkAIRateLimit("user-1", false);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetInSeconds).toBe(30);
      expect(result.errorReason).toMatch(/rate limit exceeded/i);
    });

    it("blocks request when daily quota of 15 is reached", async () => {
      mockRedis.get.mockResolvedValueOnce("15"); // 15 daily evaluations used

      const result = await checkAIRateLimit("user-1", false);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.errorReason).toMatch(/daily.*quota/i);
    });
  });

  describe("BYOK Users", () => {
    it("allows up to 30 RPM and does not enforce 15 daily limit", async () => {
      mockRedis.incr.mockResolvedValueOnce(10); // 10th request this minute
      mockRedis.ttl.mockResolvedValueOnce(50);

      const result = await checkAIRateLimit("user-byok", true);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(20); // 30 - 10
      expect(result.errorReason).toBeUndefined();
    });

    it("blocks BYOK request when exceeding 30 RPM", async () => {
      mockRedis.incr.mockResolvedValueOnce(31); // 31st request this minute
      mockRedis.ttl.mockResolvedValueOnce(20);

      const result = await checkAIRateLimit("user-byok", true);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetInSeconds).toBe(20);
      expect(result.errorReason).toMatch(/rate limit exceeded/i);
    });
  });

  describe("Fail-Safe Graceful Fallback", () => {
    it("fails open when Redis throws or is unreachable", async () => {
      mockRedis.get.mockRejectedValueOnce(new Error("Redis connection lost"));
      mockRedis.incr.mockRejectedValueOnce(new Error("Redis connection lost"));

      const result = await checkAIRateLimit("user-offline", false);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(1);
    });

    it("returns default quota when Redis is unreachable in getDailyAIQuota", async () => {
      mockRedis.get.mockRejectedValueOnce(new Error("Redis connection lost"));

      const quota = await getDailyAIQuota("user-offline", false);

      expect(quota.used).toBe(0);
      expect(quota.total).toBe(15);
      expect(quota.isByok).toBe(false);
    });
  });

  describe("getDailyAIQuota", () => {
    it("returns accurate daily usage count for platform user", async () => {
      mockRedis.get.mockResolvedValueOnce("7");

      const quota = await getDailyAIQuota("user-1", false);

      expect(quota.used).toBe(7);
      expect(quota.total).toBe(15);
      expect(quota.isByok).toBe(false);
    });

    it("returns unmetered status for BYOK user", async () => {
      mockRedis.get.mockResolvedValueOnce("42");

      const quota = await getDailyAIQuota("user-byok", true);

      expect(quota.used).toBe(42);
      expect(quota.total).toBe(-1);
      expect(quota.isByok).toBe(true);
    });
  });
});
