import { describe, expect, it, vi } from "vitest";

// Mock next/headers for request locale detection
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: (name: string) => {
      if (name === "NEXT_LOCALE") {
        return { value: "ar" };
      }
    },
    getAll: () => [{ name: "NEXT_LOCALE", value: "ar" }],
    has: (name: string) => name === "NEXT_LOCALE",
  })),
  headers: vi.fn(() => ({
    get: (name: string) => {
      if (name.toLowerCase() === "accept-language") {
        return "ar,en;q=0.8";
      }
      return null;
    },
  })),
}));

describe("request config", () => {
  it("loads messages for en and ar", async () => {
    const enCommon = await import("../../messages/en/common.json");
    const arCommon = await import("../../messages/ar/common.json");
    expect(enCommon.default).toBeDefined();
    expect(arCommon.default).toBeDefined();
    expect(enCommon.default.navigation.challenges).toBe("Challenges");
  });

  it("ar fallback has same keys as en", async () => {
    const en = await import("../../messages/en/common.json");
    const ar = await import("../../messages/ar/common.json");
    const enKeys = Object.keys(en.default);
    for (const k of enKeys) {
      expect((ar.default as Record<string, unknown>)[k]).toBeDefined();
    }
  });

  it("routing locales are valid in messages", async () => {
    const { routing } = await import("./routing");
    for (const locale of routing.locales) {
      const mod = await import(`../../messages/${locale}/common.json`);
      expect(mod.default).toBeDefined();
    }
  });
});
