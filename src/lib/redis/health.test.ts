import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(),
}));

import { getRedis } from "@/lib/redis";
import { checkRedisHealth } from "./health";

const mockedGetRedis = vi.mocked(getRedis);

const ETIMEDOUT_PATTERN = /ETIMEDOUT/i;
const ECONNREFUSED_PATTERN = /ECONNREFUSED/;
const MAX_RETRIES_PATTERN = /max retries/i;
const ENOTFOUND_PATTERN = /ENOTFOUND/;
const REDIS_NOT_INITIALIZED_PATTERN = /Redis not initialized/;

describe("checkRedisHealth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok true on successful ping", async () => {
    const fakeClient = {
      ping: vi.fn().mockResolvedValue("PONG"),
    } as unknown as ReturnType<typeof getRedis>;
    mockedGetRedis.mockReturnValue(fakeClient);

    const result = await checkRedisHealth(2000);

    expect(result.ok).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();
    expect(fakeClient.ping).toHaveBeenCalledOnce();
  });

  it("returns ok false on timeout", async () => {
    const fakeClient = {
      ping: vi.fn().mockImplementation(
        () =>
          new Promise(() => {
            // never resolves to trigger timeout
          })
      ),
    } as unknown as ReturnType<typeof getRedis>;
    mockedGetRedis.mockReturnValue(fakeClient);

    const result = await checkRedisHealth(30);

    expect(result.ok).toBe(false);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(ETIMEDOUT_PATTERN);
  });

  it("returns ok false on ECONNREFUSED", async () => {
    const err = new Error("Connection refused") as NodeJS.ErrnoException;
    err.code = "ECONNREFUSED";
    const fakeClient = {
      ping: vi.fn().mockRejectedValue(err),
    } as unknown as ReturnType<typeof getRedis>;
    mockedGetRedis.mockReturnValue(fakeClient);

    const result = await checkRedisHealth(2000);

    expect(result.ok).toBe(false);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(ECONNREFUSED_PATTERN);
  });

  it("returns ok false on MaxRetriesPerRequestError", async () => {
    const err = new Error("Reached the max retries per request limit");
    err.name = "MaxRetriesPerRequestError";
    const fakeClient = {
      ping: vi.fn().mockRejectedValue(err),
    } as unknown as ReturnType<typeof getRedis>;
    mockedGetRedis.mockReturnValue(fakeClient);

    const result = await checkRedisHealth(2000);

    expect(result.ok).toBe(false);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(MAX_RETRIES_PATTERN);
  });

  it("returns ok false on ENOTFOUND", async () => {
    const err = new Error(
      "getaddrinfo ENOTFOUND redis"
    ) as NodeJS.ErrnoException;
    err.code = "ENOTFOUND";
    const fakeClient = {
      ping: vi.fn().mockRejectedValue(err),
    } as unknown as ReturnType<typeof getRedis>;
    mockedGetRedis.mockReturnValue(fakeClient);

    const result = await checkRedisHealth(2000);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(ENOTFOUND_PATTERN);
  });

  it("returns ok false on ETIMEDOUT error from client", async () => {
    const err = new Error("ETIMEDOUT") as NodeJS.ErrnoException;
    err.code = "ETIMEDOUT";
    const fakeClient = {
      ping: vi.fn().mockRejectedValue(err),
    } as unknown as ReturnType<typeof getRedis>;
    mockedGetRedis.mockReturnValue(fakeClient);

    const result = await checkRedisHealth(2000);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(ETIMEDOUT_PATTERN);
  });

  it("returns ok false when getRedis throws synchronously", async () => {
    mockedGetRedis.mockImplementation(() => {
      throw new Error("Redis not initialized");
    });

    const result = await checkRedisHealth(2000);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(REDIS_NOT_INITIALIZED_PATTERN);
  });

  it("never throws unhandled", async () => {
    const err = new Error("unexpected") as NodeJS.ErrnoException;
    err.code = "ECONNREFUSED";
    const fakeClient = {
      ping: vi.fn().mockRejectedValue(err),
    } as unknown as ReturnType<typeof getRedis>;
    mockedGetRedis.mockReturnValue(fakeClient);

    await expect(checkRedisHealth(2000)).resolves.toEqual(
      expect.objectContaining({ ok: false })
    );
  });
});
