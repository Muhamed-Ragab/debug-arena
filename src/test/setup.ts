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
  function lookup(key: string, vars?: Record<string, unknown>): string {
    let str = key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return str;
  }
  function extractLookup(
    msg: string | { message: string },
    vars?: Record<string, unknown>
  ): string {
    let str = typeof msg === "string" ? msg : msg.message;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return str;
  }
  return {
    ...actual,
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    useExtracted:
      () =>
      (
        msg: string | { message: string; description?: string },
        vars?: Record<string, unknown>
      ) => {
        const raw = typeof msg === "string" ? msg : msg.message;
        return extractLookup(raw, vars);
      },
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
    getExtracted: vi.fn(
      async () =>
        (
          msg: string | { message: string; description?: string },
          vars?: Record<string, unknown>
        ) => {
          let str = typeof msg === "string" ? msg : msg.message;
          if (vars) {
            for (const [k, v] of Object.entries(vars)) {
              str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
            }
          }
          return str;
        }
    ),
    getLocale: vi.fn(async () => "en"),
    getMessages: vi.fn(async () => ({})),
    getTranslations: vi.fn((ns?: string) => {
      function lookup(key: string, vars?: Record<string, unknown>) {
        const fullKey = ns ? `${ns}.${key}` : key;
        let str = fullKey;
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
