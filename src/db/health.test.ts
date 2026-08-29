import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  pool: {
    query: mockQuery,
  },
}));

import { checkDbHealth, withTimeout } from "./health";

describe("db/health", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe("withTimeout", () => {
    it("resolves when promise resolves before timeout", async () => {
      const result = await withTimeout(Promise.resolve("ok"), 100);
      expect(result).toBe("ok");
    });

    it("rejects when promise exceeds timeout", async () => {
      const never = new Promise<string>(() => undefined);
      const error = await withTimeout(never, 20).catch(
        (e: unknown) => e as Error
      );
      expect((error as Error).message).toContain("Timed out after 20ms");
    });

    it("rejects with inner error when promise rejects before timeout", async () => {
      const failing = Promise.resolve().then(() => {
        throw new Error("inner fail");
      });
      const error = await withTimeout(failing, 100).catch(
        (e: unknown) => e as Error
      );
      expect((error as Error).message).toBe("inner fail");
    });
  });

  describe("checkDbHealth", () => {
    it("returns ok true on successful query", async () => {
      mockQuery.mockResolvedValue({ rows: [{ "?column?": 1 }] });

      const result = await checkDbHealth(2000);

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
      expect(mockQuery).toHaveBeenCalledWith("SELECT 1");
    });

    it("returns ok false on timeout (never resolving query)", async () => {
      mockQuery.mockReturnValue(new Promise(() => undefined));

      const result = await checkDbHealth(20);

      expect(result.ok).toBe(false);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.error).toContain("Timed out");
    });

    it("returns ok false on ECONNREFUSED", async () => {
      const err = new Error(
        "connect ECONNREFUSED 127.0.0.1:5432"
      ) as NodeJS.ErrnoException;
      err.code = "ECONNREFUSED";
      mockQuery.mockRejectedValue(err);

      const result = await checkDbHealth(2000);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("ECONNREFUSED");
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("returns ok false on ETIMEDOUT from pool", async () => {
      const err = new Error("ETIMEDOUT query") as NodeJS.ErrnoException;
      err.code = "ETIMEDOUT";
      mockQuery.mockRejectedValue(err);

      const result = await checkDbHealth(2000);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("ETIMEDOUT");
    });

    it("returns ok false on ENOTFOUND", async () => {
      const err = new Error(
        "getaddrinfo ENOTFOUND db"
      ) as NodeJS.ErrnoException;
      err.code = "ENOTFOUND";
      mockQuery.mockRejectedValue(err);

      const result = await checkDbHealth(2000);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("ENOTFOUND");
    });

    it("returns ok false on 57P01 admin shutdown", async () => {
      const err = new Error("57P01 admin shutdown") as NodeJS.ErrnoException & {
        code: string;
      };
      err.code = "57P01";
      mockQuery.mockRejectedValue(err);

      const result = await checkDbHealth(2000);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("57P01");
    });

    it("returns ok false on generic pool error", async () => {
      mockQuery.mockRejectedValue(new Error("unexpected pool error"));

      const result = await checkDbHealth(2000);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("unexpected pool error");
    });

    it("never throws - handles non-Error rejection", async () => {
      mockQuery.mockRejectedValue("string rejection");

      const result = await checkDbHealth(2000);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("string rejection");
    });

    it("measures latencyMs as number", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await checkDbHealth(1000);

      expect(typeof result.latencyMs).toBe("number");
      expect(Number.isFinite(result.latencyMs)).toBe(true);
    });
  });
});
