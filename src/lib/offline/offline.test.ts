import { describe, expect, it } from "vitest";
import {
  isOfflineCause,
  isOfflineError,
  OFFLINE_MESSAGE,
  OfflineError,
  toOfflineError,
} from "./index";

function codeError(code: string, message = code): Error & { code: string } {
  const e = new Error(message) as Error & { code: string };
  e.code = code;
  return e;
}

describe("isOfflineCause", () => {
  it("returns true for ENOTFOUND", () => {
    expect(isOfflineCause(codeError("ENOTFOUND"))).toBe(true);
  });

  it("returns true for ECONNRESET", () => {
    expect(isOfflineCause(codeError("ECONNRESET"))).toBe(true);
  });

  it("returns true for ETIMEDOUT", () => {
    expect(isOfflineCause(codeError("ETIMEDOUT"))).toBe(true);
  });

  it("returns true for ECONNREFUSED", () => {
    expect(isOfflineCause(codeError("ECONNREFUSED"))).toBe(true);
  });

  it("returns true for EHOSTUNREACH", () => {
    expect(isOfflineCause(codeError("EHOSTUNREACH"))).toBe(true);
  });

  it("returns true for EAI_AGAIN", () => {
    expect(isOfflineCause(codeError("EAI_AGAIN"))).toBe(true);
  });

  it("returns true for 57P01 admin shutdown", () => {
    expect(isOfflineCause(codeError("57P01"))).toBe(true);
  });

  it("returns true for fetch TypeError with fetch failed", () => {
    const err = new TypeError("fetch failed");
    expect(isOfflineCause(err)).toBe(true);
  });

  it("returns true for ioredis MaxRetriesPerRequestError", () => {
    const err = new Error(
      'Reached the max retries per request limit (which is 20). Refer to "maxRetriesPerRequest" option for details.'
    );
    expect(isOfflineCause(err)).toBe(true);
  });

  it("returns false for P2002 validation error", () => {
    expect(isOfflineCause(codeError("P2002"))).toBe(false);
  });

  it("returns true when cause is offline", () => {
    const cause = codeError("ENOTFOUND");
    const outer = new Error("outer", { cause });
    expect(isOfflineCause(outer)).toBe(true);
  });

  it("returns false for generic error", () => {
    expect(isOfflineCause(new Error("some random error"))).toBe(false);
  });
});

describe("isOfflineError", () => {
  it("returns true for OfflineError instance", () => {
    const err = new OfflineError(OFFLINE_MESSAGE);
    expect(isOfflineError(err)).toBe(true);
  });

  it("returns false for generic Error", () => {
    expect(isOfflineError(new Error("generic"))).toBe(false);
  });
});

describe("toOfflineError", () => {
  it("maps offline cause to OfflineError with OFFLINE_MESSAGE", () => {
    const cause = codeError("ECONNREFUSED");
    const result = toOfflineError(cause);
    expect(result).toBeInstanceOf(OfflineError);
    expect(result.message).toBe(OFFLINE_MESSAGE);
    expect(result.status).toBe(503);
  });

  it("preserves cause", () => {
    const cause = codeError("ETIMEDOUT");
    const result = toOfflineError(cause);
    expect(result.cause).toBe(cause);
  });

  it("passes through non-offline error message", () => {
    const err = new Error("validation failed P2002");
    const result = toOfflineError(err);
    expect(result).toBeInstanceOf(OfflineError);
    expect(result.message).toBe("validation failed P2002");
  });
});

describe("OfflineError", () => {
  it("is instance of Error and OfflineError with status 503", () => {
    const err = new OfflineError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(OfflineError);
    expect(err.status).toBe(503);
    expect(err.name).toBe("OfflineError");
  });
});
