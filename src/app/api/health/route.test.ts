import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCheckDbHealth, mockCheckRedisHealth } = vi.hoisted(() => ({
  mockCheckDbHealth: vi.fn(),
  mockCheckRedisHealth: vi.fn(),
}));

vi.mock("@/db/health", () => ({
  checkDbHealth: mockCheckDbHealth,
}));

vi.mock("@/lib/redis/health", () => ({
  checkRedisHealth: mockCheckRedisHealth,
}));

// imports after mocks for hoisting
import { OFFLINE_MESSAGE } from "@/lib/offline";
import { dynamic, GET, HEAD, revalidate } from "./route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports dynamic = force-dynamic and revalidate = 0", () => {
    expect(dynamic).toBe("force-dynamic");
    expect(revalidate).toBe(0);
  });

  it("returns 200 with success true when both checks ok", async () => {
    mockCheckDbHealth.mockResolvedValue({ latencyMs: 5, ok: true });
    mockCheckRedisHealth.mockResolvedValue({ latencyMs: 3, ok: true });

    const res = await GET();
    const body = (await res.json()) as {
      success: boolean;
      data: {
        status: string;
        checks: {
          db: { ok: boolean; latencyMs: number; error?: string };
          redis: { ok: boolean; latencyMs: number; error?: string };
        };
        timestamp: string;
        uptime: number;
      };
      error: string | null;
    };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(body.error).toBeNull();
    expect(body.data.checks.db.ok).toBe(true);
    expect(body.data.checks.redis.ok).toBe(true);
    expect(mockCheckDbHealth).toHaveBeenCalledWith(2000);
    expect(mockCheckRedisHealth).toHaveBeenCalledWith(2000);
  });

  it("has correct envelope shape with timestamp and uptime", async () => {
    mockCheckDbHealth.mockResolvedValue({ latencyMs: 12, ok: true });
    mockCheckRedisHealth.mockResolvedValue({ latencyMs: 7, ok: true });

    const res = await GET();
    const body = (await res.json()) as {
      success: boolean;
      data: {
        status: string;
        checks: { db: unknown; redis: unknown };
        timestamp: string;
        uptime: number;
      };
      error: string | null;
    };

    expect(body).toHaveProperty("success");
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("error");
    expect(body.data).toHaveProperty("status");
    expect(body.data).toHaveProperty("checks");
    expect(body.data).toHaveProperty("timestamp");
    expect(body.data).toHaveProperty("uptime");
    expect(typeof body.data.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(body.data.timestamp))).toBe(false);
    expect(typeof body.data.uptime).toBe("number");
  });

  it("returns 503 with degraded when db is not ok", async () => {
    mockCheckDbHealth.mockResolvedValue({
      error: "ECONNREFUSED",
      latencyMs: 10,
      ok: false,
    });
    mockCheckRedisHealth.mockResolvedValue({ latencyMs: 2, ok: true });

    const res = await GET();
    const body = (await res.json()) as {
      success: boolean;
      data: { status: string; checks: { db: { ok: boolean } } };
      error: string | null;
    };

    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.data.status).toBe("degraded");
    expect(body.error).toBe(OFFLINE_MESSAGE);
  });

  it("returns 503 with degraded when redis is not ok", async () => {
    mockCheckDbHealth.mockResolvedValue({ latencyMs: 4, ok: true });
    mockCheckRedisHealth.mockResolvedValue({
      error: "ETIMEDOUT",
      latencyMs: 2000,
      ok: false,
    });

    const res = await GET();
    const body = (await res.json()) as {
      success: boolean;
      data: { status: string };
      error: string | null;
    };

    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.data.status).toBe("degraded");
    expect(body.error).toBe(OFFLINE_MESSAGE);
  });

  it("returns 503 when both checks fail", async () => {
    mockCheckDbHealth.mockResolvedValue({
      error: "ENOTFOUND",
      latencyMs: 5,
      ok: false,
    });
    mockCheckRedisHealth.mockResolvedValue({
      error: "ECONNREFUSED",
      latencyMs: 5,
      ok: false,
    });

    const res = await GET();
    const body = (await res.json()) as {
      success: boolean;
      error: string | null;
    };

    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.error).toBe(OFFLINE_MESSAGE);
  });

  it("handles rejected promises via allSettled as degraded", async () => {
    mockCheckDbHealth.mockRejectedValue(new Error("db explode"));
    mockCheckRedisHealth.mockResolvedValue({ latencyMs: 3, ok: true });

    const res = await GET();
    const body = (await res.json()) as {
      success: boolean;
      data: { checks: { db: { ok: boolean; error: string } } };
      error: string | null;
    };

    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.data.checks.db.ok).toBe(false);
    expect(body.data.checks.db.error).toContain("db explode");
  });

  it("propagates error field from failing check in data.checks", async () => {
    mockCheckDbHealth.mockResolvedValue({
      error: "57P01",
      latencyMs: 8,
      ok: false,
    });
    mockCheckRedisHealth.mockResolvedValue({ latencyMs: 2, ok: true });

    const res = await GET();
    const body = (await res.json()) as {
      data: { checks: { db: { error: string } } };
    };

    expect(body.data.checks.db.error).toBe("57P01");
  });
});

describe("next.config rewrites", () => {
  it("exposes /health -> /api/health rewrite", async () => {
    const mod = await import("../../../../next.config");
    // next.config is ESM via createNextIntlPlugin; handle default export shape
    const cfg = (mod.default ?? mod) as {
      rewrites?: () => Promise<Array<{ source: string; destination: string }>>;
    };
    if (typeof cfg.rewrites === "function") {
      const rewrites = await cfg.rewrites();
      expect(rewrites[0]?.source).toBe("/health");
      expect(rewrites[0]?.destination).toBe("/api/health");
    }
  });

  it("rejected health check yields defined latencyMs", async () => {
    mockCheckDbHealth.mockRejectedValue(new Error("boom"));
    mockCheckRedisHealth.mockResolvedValue({ latencyMs: 1, ok: true });
    const res = await GET();
    const body = (await res.json()) as {
      data: { checks: { db: { latencyMs: number; error: string } } };
    };
    expect(typeof body.data.checks.db.latencyMs).toBe("number");
    expect(body.data.checks.db.latencyMs).toBeGreaterThanOrEqual(0);
    expect(body.data.checks.db.error).toContain("boom");
  });
});

describe("HEAD /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with no body when healthy", async () => {
    mockCheckDbHealth.mockResolvedValue({ latencyMs: 5, ok: true });
    mockCheckRedisHealth.mockResolvedValue({ latencyMs: 3, ok: true });

    const res = await HEAD();
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toBe("");
  });

  it("returns 503 with no body when degraded", async () => {
    mockCheckDbHealth.mockResolvedValue({
      error: "ETIMEDOUT",
      latencyMs: 10,
      ok: false,
    });
    mockCheckRedisHealth.mockResolvedValue({ latencyMs: 2, ok: true });

    const res = await HEAD();
    const text = await res.text();

    expect(res.status).toBe(503);
    expect(text).toBe("");
  });

  it("HEAD status matches GET status for healthy", async () => {
    mockCheckDbHealth.mockResolvedValue({ latencyMs: 5, ok: true });
    mockCheckRedisHealth.mockResolvedValue({ latencyMs: 3, ok: true });

    const getRes = await GET();
    // reset history to re-call for HEAD comparison
    mockCheckDbHealth.mockResolvedValue({ latencyMs: 5, ok: true });
    mockCheckRedisHealth.mockResolvedValue({ latencyMs: 3, ok: true });

    const headRes = await HEAD();

    expect(headRes.status).toBe(getRes.status);
  });

  it("HEAD status matches GET status for degraded", async () => {
    mockCheckDbHealth.mockResolvedValue({ latencyMs: 5, ok: true });
    mockCheckRedisHealth.mockResolvedValue({
      error: "ECONNREFUSED",
      latencyMs: 5,
      ok: false,
    });

    const getRes = await GET();

    mockCheckDbHealth.mockResolvedValue({ latencyMs: 5, ok: true });
    mockCheckRedisHealth.mockResolvedValue({
      error: "ECONNREFUSED",
      latencyMs: 5,
      ok: false,
    });

    const headRes = await HEAD();

    expect(headRes.status).toBe(getRes.status);
  });
});
