import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PREFIXES = [
  "/challenges",
  "/leaderboard",
  "/profile",
  "/settings",
  "/submissions",
  "/admin",
];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export function proxy(request: NextRequest) {
  // Run next-intl locale handling (NEXT_LOCALE cookie / Accept-Language header)
  // In localePrefix:'never' mode this just injects locale headers and may set default cookie
  const intlResponse = intlMiddleware(request);

  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    // Propagate all cookies set by intl middleware (NEXT_LOCALE etc.)
    for (const cookie of intlResponse.cookies.getAll()) {
      redirectRes.cookies.set(cookie);
    }
    return redirectRes;
  }

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  if (isAuthRoute && sessionCookie) {
    const redirectRes = NextResponse.redirect(
      new URL("/challenges", request.url)
    );
    for (const cookie of intlResponse.cookies.getAll()) {
      redirectRes.cookies.set(cookie);
    }
    return redirectRes;
  }

  return intlResponse;
}

export const config = {
  matcher: [
    // Intentionally excludes `api` (auth endpoints guarded server-side via better-auth)
    // and `health` (liveness probe must stay unauthenticated) plus static assets.
    "/((?!api|_next|_vercel|health|.*\\..*).*)",
  ],
};
