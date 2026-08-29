import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// Load all namespaces for the locale and merge into single messages object
// Each JSON file corresponds to a namespace top-level key
const namespaces = [
  "common",
  "auth",
  "landing",
  "challenge",
  "browser",
  "admin",
  "profile",
  "results",
  "leaderboard",
  "category",
  "error",
  "difficulty",
  "status",
  "validation",
] as const;

export default getRequestConfig(async ({ locale }) => {
  if (
    !(
      locale &&
      routing.locales.includes(locale as (typeof routing.locales)[number])
    )
  ) {
    locale = routing.defaultLocale;
  }

  const messages: Record<string, unknown> = {};

  for (const ns of namespaces) {
    try {
      const mod = await import(`../../messages/${locale}/${ns}.json`);
      messages[ns] = mod.default ?? mod;
    } catch {
      // Fallback to en if locale file missing
      if (locale !== "en") {
        const fallback = await import(`../../messages/en/${ns}.json`);
        messages[ns] = fallback.default ?? fallback;
      }
    }
  }

  return { locale, messages };
});
