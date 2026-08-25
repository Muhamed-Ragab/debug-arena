import { describe, expect, it } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import type { AuthenticatedRequest } from "./authenticated-request";

function makeReflector(roles: string[]): Reflector {
  return { getAllAndOverride: () => roles } as unknown as Reflector;
}

function ctxWith(userRole: string | undefined) {
  const req: Partial<AuthenticatedRequest> = { headers: {} };
  if (userRole !== undefined) {
    req.user = { id: "u1", email: "e@e.e", name: null, image: null, role: userRole };
  }
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  };
}

describe("RolesGuard", () => {
  it("allows when user role is in required roles", async () => {
    const guard = new RolesGuard(makeReflector(["admin"]));
    await expect(guard.canActivate(ctxWith("admin") as never)).resolves.toBe(true);
  });

  it("rejects with ForbiddenException when role missing", async () => {
    const guard = new RolesGuard(makeReflector(["admin"]));
    await expect(guard.canActivate(ctxWith("user") as never)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("rejects anonymous requests even for public-ish handlers", async () => {
    const guard = new RolesGuard(makeReflector(["user"]));
    await expect(guard.canActivate(ctxWith(undefined) as never)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
