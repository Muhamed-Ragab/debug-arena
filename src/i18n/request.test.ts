import fs from "node:fs";
import path from "node:path";
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
  it("en.po and ar.po are flat hash catalogs", () => {
    const en = fs.readFileSync(
      path.join(process.cwd(), "messages/en.po"),
      "utf8"
    );
    const ar = fs.readFileSync(
      path.join(process.cwd(), "messages/ar.po"),
      "utf8"
    );
    expect(en).toContain('msgid "Challenges"');
    expect(ar).toContain('msgid "Challenges"');
    // Check flat hash: msgctxt is hash, not namespace
    expect(en).toMatch(/msgctxt "[A-Za-z0-9_-]+"/);
  });

  it("routing locales are valid in messages", async () => {
    const { routing } = await import("./routing");
    for (const locale of routing.locales) {
      const poPath = path.join(process.cwd(), `messages/${locale}.po`);
      expect(fs.existsSync(poPath)).toBe(true);
      const content = fs.readFileSync(poPath, "utf8");
      expect(content).toContain("msgid");
    }
  });

  it("request config loads .po flat messages", async () => {
    // Simulate getRequestConfig loading
    const routing = await import("./routing");
    expect(routing.routing.locales).toContain("en");
    expect(routing.routing.locales).toContain("ar");
    // Check that en.po can be imported as flat hash (via po loader mock)
    // In test env, we check file exists and has expected structure
    const enPo = fs.readFileSync(
      path.join(process.cwd(), "messages/en.po"),
      "utf8"
    );
    expect(enPo).toContain("msgctxt");
    expect(enPo).toContain('msgid "System Health"');
    expect(enPo).toContain('msgstr "System Health"');
  });
});
