import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "node:http";
import type { SessionUser } from "./authenticated-request";
import { auth } from "../auth/auth";

async function resolveSession(headers: IncomingHttpHeaders): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(headers) });
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role: session.user.role ?? null,
  };
}

@Injectable()
export class BetterAuthSessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: IncomingHttpHeaders;
      user?: SessionUser;
    }>();
    const user = await resolveSession(request.headers);
    if (!user) throw new UnauthorizedException();
    request.user = user;
    return true;
  }
}

@Injectable()
export class OptionalBetterAuthSessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: IncomingHttpHeaders;
      user?: SessionUser;
    }>();
    const user = await resolveSession(request.headers);
    if (user) request.user = user;
    return true; // anonymous passes through
  }
}
