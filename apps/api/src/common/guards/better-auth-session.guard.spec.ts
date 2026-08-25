import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedRequest } from "./authenticated-request";
import { BetterAuthSessionGuard, OptionalBetterAuthSessionGuard } from "./better-auth-session.guard";

const getSessionMock = vi.fn();
vi.mock("../auth/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSessionMock(...args) } },
}));

function fakeContext(req: Partial<AuthenticatedRequest>) {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  };
}

beforeEach(() => {
  getSessionMock.mockReset();
});

describe("BetterAuthSessionGuard", () => {
  it("attaches the session user and allows access", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1", email: "a@b.c", name: "Ada", image: null, role: "user" },
      session: { id: "s1" },
    });
    const guard = new BetterAuthSessionGuard();
    const req: Partial<AuthenticatedRequest> = { headers: {} };
    const ok = await guard.canActivate(fakeContext(req) as never);
    expect(ok).toBe(true);
    expect(req.user).toEqual({
      id: "u1",
      email: "a@b.c",
      name: "Ada",
      image: null,
      role: "user",
    });
  });

  it("throws UnauthorizedException when no session exists", async () => {
    getSessionMock.mockResolvedValue(null);
    const guard = new BetterAuthSessionGuard();
    await expect(guard.canActivate(fakeContext({ headers: {} }) as never)).rejects.toThrow(
      "Unauthorized",
    );
  });
});

describe("OptionalBetterAuthSessionGuard", () => {
  it("passes through without a session and does not set user", async () => {
    getSessionMock.mockResolvedValue(null);
    const guard = new OptionalBetterAuthSessionGuard();
    const req: Partial<AuthenticatedRequest> = { headers: {} };
    const ok = await guard.canActivate(fakeContext(req) as never);
    expect(ok).toBe(true);
    expect(req.user).toBeUndefined();
  });

  it("attaches user when a session exists", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u2", email: "x@y.z", name: null, image: null, role: "admin" },
      session: { id: "s2" },
    });
    const guard = new OptionalBetterAuthSessionGuard();
    const req: Partial<AuthenticatedRequest> = { headers: {} };
    await guard.canActivate(fakeContext(req) as never);
    expect(req.user?.id).toBe("u2");
  });
});
