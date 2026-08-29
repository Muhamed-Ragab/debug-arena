import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
});

// Mock next/headers for next-intl server utilities in Vitest jsdom
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => undefined),
    getAll: vi.fn(() => []),
    has: vi.fn(() => false),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
}));

// Mock next/navigation for LanguageSwitcher router.refresh
vi.mock("next/navigation", async () => {
  const actual =
    await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    usePathname: () => "/",
    useRouter: () => ({
      prefetch: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
  };
});

// Mock next-intl client hooks to provide translations without provider
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  const messages = await import("../../messages/en.json").then(
    (m) => m.default
  );
  // Flatten helper for lookup
  function lookup(key: string, vars?: Record<string, unknown>): string {
    const parts = key.split(".");
    let cur: unknown = messages;
    for (const p of parts) {
      if (
        cur &&
        typeof cur === "object" &&
        p in (cur as Record<string, unknown>)
      ) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        cur = undefined;
        break;
      }
    }
    let str = typeof cur === "string" ? cur : key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return str;
  }
  return {
    ...actual,
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    useLocale: () => "en",
    useTranslations:
      (namespace?: string) => (key: string, vars?: Record<string, unknown>) => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        return lookup(fullKey, vars);
      },
  };
});

// Mock next-intl server utilities to return deterministic locale/messages in tests
vi.mock("next-intl/server", async () => {
  const actual =
    await vi.importActual<typeof import("next-intl/server")>(
      "next-intl/server"
    );
  return {
    ...actual,
    getLocale: vi.fn(async () => "en"),
    getMessages: vi.fn(async () => {
      const common = await import("../../messages/en/common.json").then(
        (m) => m.default
      );
      return { common };
    }),
    getTranslations: vi.fn(async (ns?: string) => {
      const msgs = await import("../../messages/en.json").then(
        (m) => m.default
      );
      function lookup(key: string, vars?: Record<string, unknown>) {
        const fullKey = ns ? `${ns}.${key}` : key;
        const parts = fullKey.split(".");
        let cur: unknown = msgs;
        for (const p of parts) {
          if (
            cur &&
            typeof cur === "object" &&
            p in (cur as Record<string, unknown>)
          ) {
            cur = (cur as Record<string, unknown>)[p];
          } else {
            cur = undefined;
            break;
          }
        }
        let str = typeof cur === "string" ? cur : fullKey;
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
          }
        }
        return str;
      }
      return (key: string, vars?: Record<string, unknown>) => lookup(key, vars);
    }),
  };
});
