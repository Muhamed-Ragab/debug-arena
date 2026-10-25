import { env } from "@/lib/env/env";

export const DEFAULT_PRODUCTION_URL = "https://debug-arena-ai.vercel.app";

/**
 * Normalizes a URL string by ensuring it has a protocol and removing trailing slashes.
 */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return DEFAULT_PRODUCTION_URL;
  }
  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

/**
 * Resolves the application base URL with strict fallback hierarchy:
 * 1. env.NEXT_PUBLIC_APP_URL
 * 2. env.VERCEL_PROJECT_PRODUCTION_URL
 * 3. env.VERCEL_URL
 * 4. DEFAULT_PRODUCTION_URL ("https://debug-arena-ai.vercel.app")
 */
export function getBaseUrl(): string {
  if (env.NEXT_PUBLIC_APP_URL) {
    return normalizeUrl(env.NEXT_PUBLIC_APP_URL);
  }

  const vercelProductionUrl = env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) {
    return normalizeUrl(vercelProductionUrl);
  }

  const vercelUrl = env.VERCEL_URL;
  if (vercelUrl) {
    return normalizeUrl(vercelUrl);
  }

  return DEFAULT_PRODUCTION_URL;
}

export const SITE_CONFIG = {
  author: {
    name: "Debug Arena Team",
    url: getBaseUrl(),
  },
  creator: "@debugarena",
  description:
    "Learn debugging by fixing real bugs in live code sandboxes with AI-powered grading, diagnostic radar analytics, and real-world scenarios.",
  keywords: [
    "debugging",
    "code challenges",
    "bug fixing",
    "developer diagnostic skills",
    "interactive debugging",
    "software engineering",
    "full stack debugging",
    "learn debugging",
    "troubleshooting",
  ],
  name: "Debug Arena",
  tagline: "Master Software Debugging",
  url: getBaseUrl(),
} as const;
