import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

const handleI18nRouting = createMiddleware(routing);

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

function resolveI18nResponse(request: NextRequest): NextResponse {
  const i18nResponse = handleI18nRouting(request);

  if (
    routing.localePrefix !== "never" ||
    !i18nResponse.headers.get("x-middleware-rewrite")
  ) {
    return i18nResponse;
  }

  const locale =
    i18nResponse.headers.get("x-next-intl-locale") ?? routing.defaultLocale;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-intl-locale", locale);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-next-intl-locale", locale);

  for (const cookie of i18nResponse.cookies.getAll()) {
    response.cookies.set(cookie);
  }

  for (const [key, value] of i18nResponse.headers.entries()) {
    if (
      key === "Link" ||
      (key.startsWith("x-next-intl-") && key !== "x-middleware-rewrite")
    ) {
      response.headers.set(key, value);
    }
  }

  return response;
}

function applyI18nToRedirect(
  redirect: NextResponse,
  source: NextResponse
): void {
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }

  const locale = source.headers.get("x-next-intl-locale");
  if (locale) {
    redirect.headers.set("x-next-intl-locale", locale);
  }

  const link = source.headers.get("Link");
  if (link) {
    redirect.headers.set("Link", link);
  }
}

export default async function proxy(request: NextRequest) {
  const session = await getSession(request);
  const role = session?.user?.role ?? null;
  const hasSession = !!session;

  const response = resolveI18nResponse(request);

  const redirectUrl = getRedirectUrl(
    request.nextUrl.pathname,
    request.nextUrl.searchParams.get("callbackUrl"),
    hasSession,
    role
  );

  if (!redirectUrl) {
    return response;
  }

  const redirect = NextResponse.redirect(new URL(redirectUrl, request.url));
  applyI18nToRedirect(redirect, response);
  return redirect;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|health|.*\\..*).*)"],
};
