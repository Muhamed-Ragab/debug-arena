import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PREFIXES = [
  "/challenges",
  "/leaderboard",
  "/profile",
  "/settings",
  "/submissions",
  "/admin",
] as const;

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"] as const;

function isSafeCallback(url: string | null): url is string {
  return (
    typeof url === "string" && url.startsWith("/") && !url.startsWith("//")
  );
}

async function getSession(request: NextRequest) {
  try {
    return await auth.api.getSession({ headers: request.headers });
  } catch {
    return null;
  }
}

function getRedirectUrl(
  pathname: string,
  callbackUrl: string | null,
  hasSession: boolean,
  role: string | null
): string | null {
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (isProtected && !hasSession) {
    return `/login?callbackUrl=${encodeURIComponent(pathname)}`;
  }

  if (pathname.startsWith("/admin") && hasSession && role !== "admin") {
    return "/challenges";
  }

  const isAuthRoute = (AUTH_ROUTES as readonly string[]).includes(pathname);
  if (isAuthRoute && hasSession) {
    if (isSafeCallback(callbackUrl)) {
      if (callbackUrl.startsWith("/admin") && role !== "admin") {
        return "/challenges";
      }
      return callbackUrl;
    }
    return role === "admin" ? "/admin" : "/challenges";
  }

  return null;
}

export default async function proxy(request: NextRequest) {
  const session = await getSession(request);
  const role = session?.user?.role ?? null;
  const hasSession = !!session;

  const redirectUrl = getRedirectUrl(
    request.nextUrl.pathname,
    request.nextUrl.searchParams.get("callbackUrl"),
    hasSession,
    role
  );

  if (!redirectUrl) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(redirectUrl, request.url));
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|health|.*\\..*).*)"],
};
