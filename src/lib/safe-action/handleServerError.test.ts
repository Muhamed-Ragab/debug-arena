import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { OFFLINE_MESSAGE, OfflineError } from "@/lib/offline";
import {
  ActionError,
  actionClient,
  ConflictError,
  handleServerError,
  NotFoundError,
} from "./index";

function codeError(code: string, message = code): Error & { code: string } {
  const e = new Error(message) as Error & { code: string };
  e.code = code;
  return e;
}

describe("handleServerError", () => {
  it("maps offline code to OFFLINE_MESSAGE", () => {
    const err = codeError("ECONNREFUSED");
    expect(handleServerError(err)).toBe(OFFLINE_MESSAGE);
  });

  it("maps offline message fetch failed to OFFLINE_MESSAGE", () => {
    const err = new TypeError("fetch failed");
    expect(handleServerError(err)).toBe(OFFLINE_MESSAGE);
  });

  it("maps OfflineError instance to OFFLINE_MESSAGE", () => {
    const err = new OfflineError("custom offline");
    expect(handleServerError(err)).toBe(OFFLINE_MESSAGE);
  });

  it("unwraps cause chain containing offline code", () => {
    const cause = codeError("ENOTFOUND");
    const outer = new Error("outer wrapper", { cause });
    expect(handleServerError(outer)).toBe(OFFLINE_MESSAGE);
  });

  it("unwraps deep cause chain", () => {
    const root = codeError("ETIMEDOUT");
    const mid = new Error("mid", { cause: root });
    const outer = new Error("outer", { cause: mid });
    expect(handleServerError(outer)).toBe(OFFLINE_MESSAGE);
  });

  it("maps toOfflineError offline detection via message", () => {
    const err = new Error("Connection terminated unexpectedly");
    expect(handleServerError(err)).toBe(OFFLINE_MESSAGE);
  });

  it("passes through ActionError message", () => {
    const err = new ActionError("Unauthorized");
    expect(handleServerError(err)).toBe("Unauthorized");
  });

  it("passes through ActionError with custom message", () => {
    const err = new ActionError("Forbidden: Admin access required");
    expect(handleServerError(err)).toBe("Forbidden: Admin access required");
  });

  it("sanitizes unknown error to generic message", () => {
    const err = new Error("sensitive internal failure");
    expect(handleServerError(err)).toBe("Something went wrong");
  });

  it("does not leak secret in sanitized error", () => {
    const secret = "DATABASE_URL=postgres://secret:123@localhost/db";
    const err = new Error(secret);
    const result = handleServerError(err);
    expect(result).toBe("Something went wrong");
    expect(result).not.toContain("postgres");
    expect(result).not.toContain("secret");
    expect(result).not.toContain(secret);
  });

  it("does not leak error.message for unknown code", () => {
    const err = codeError(
      "P2002",
      "Unique constraint failed on the fields: (`email`)"
    );
    expect(handleServerError(err)).toBe("Something went wrong");
  });

  it("does not leak ECONNREFUSED message content", () => {
    const err = codeError(
      "ECONNREFUSED",
      "connect ECONNREFUSED 127.0.0.1:5432"
    );
    const result = handleServerError(err);
    expect(result).toBe(OFFLINE_MESSAGE);
    expect(result).not.toContain("127.0.0.1");
  });

  it("returns OFFLINE_MESSAGE for maxRetriesPerRequestError", () => {
    const err = new Error(
      'Reached the max retries per request limit (which is 20). Refer to "maxRetriesPerRequest" option for details.'
    );
    expect(handleServerError(err)).toBe(OFFLINE_MESSAGE);
  });

  it("passes through ConflictError message (subclass of ActionError)", () => {
    const err = new ConflictError('Category slug "dup" already exists');
    expect(handleServerError(err)).toBe('Category slug "dup" already exists');
    expect(err).toBeInstanceOf(ActionError);
    expect(err.code).toBe("CONFLICT");
    expect(err.status).toBe(409);
  });

  it("passes through NotFoundError message (subclass of ActionError)", () => {
    const err = new NotFoundError("Category not found");
    expect(handleServerError(err)).toBe("Category not found");
    expect(err).toBeInstanceOf(ActionError);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.status).toBe(404);
  });

  it("sanitizes generic Error even with 409-like message", () => {
    const err = new Error('Category slug "dup" already exists');
    expect(handleServerError(err)).toBe("Something went wrong");
  });
});

describe("safe-action clients share handleServerError", () => {
  it("actionClient maps offline error to OFFLINE_MESSAGE via serverError", async () => {
    const offlineAction = actionClient
      .inputSchema(z.object({ v: z.string() }))
      .action(() => {
        throw codeError("ECONNREFUSED", "connect ECONNREFUSED 127.0.0.1:5432");
      });

    const result = await offlineAction({ v: "x" });
    expect(result?.serverError).toBe(OFFLINE_MESSAGE);
  });

  it("actionClient surfaces ActionError message via serverError", async () => {
    const action = actionClient
      .inputSchema(z.object({ v: z.string() }))
      .action(() => {
        throw new ActionError("Custom business error");
      });

    const result = await action({ v: "x" });
    expect(result?.serverError).toBe("Custom business error");
  });

  it("actionClient sanitizes unknown error", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const action = actionClient
      .inputSchema(z.object({ v: z.string() }))
      .action(() => {
        throw new Error("internal secret 12345");
      });

    const result = await action({ v: "x" });
    expect(result?.serverError).toBe("Something went wrong");
    expect(result?.serverError).not.toContain("secret");
    consoleSpy.mockRestore();
  });

  it("actionClient maps cause chain offline to OFFLINE_MESSAGE", async () => {
    const action = actionClient
      .inputSchema(z.object({ v: z.string() }))
      .action(() => {
        const cause = codeError(
          "ENOTFOUND",
          "getaddrinfo ENOTFOUND db.example.com"
        );
        throw new Error("query failed", { cause });
      });

    const result = await action({ v: "x" });
    expect(result?.serverError).toBe(OFFLINE_MESSAGE);
  });

  it("actionClient surfaces ConflictError via serverError", async () => {
    const action = actionClient
      .inputSchema(z.object({ v: z.string() }))
      .action(() => {
        throw new ConflictError('Category slug "dup" already exists');
      });

    const result = await action({ v: "x" });
    expect(result?.serverError).toBe('Category slug "dup" already exists');
  });

  it("actionClient surfaces NotFoundError via serverError", async () => {
    const action = actionClient
      .inputSchema(z.object({ v: z.string() }))
      .action(() => {
        throw new NotFoundError("Challenge not found");
      });

    const result = await action({ v: "x" });
    expect(result?.serverError).toBe("Challenge not found");
  });
});
