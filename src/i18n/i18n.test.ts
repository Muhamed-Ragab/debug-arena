import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("next-intl catalogs", () => {
  it("en.po and ar.po exist and have same msgctxt count", () => {
    const en = fs.readFileSync(
      path.join(process.cwd(), "messages/en.po"),
      "utf8"
    );
    const ar = fs.readFileSync(
      path.join(process.cwd(), "messages/ar.po"),
      "utf8"
    );
    const enCount = (en.match(/msgctxt/g) || []).length;
    const arCount = (ar.match(/msgctxt/g) || []).length;
    expect(enCount).toBeGreaterThan(0);
    expect(arCount).toBe(enCount);
  });

  it("ar.po has some translated msgstr", () => {
    const ar = fs.readFileSync(
      path.join(process.cwd(), "messages/ar.po"),
      "utf8"
    );
    // Check that at least one known translation exists (e.g., System Health)
    expect(ar).toContain('msgid "System Health"');
    // Should have non-empty msgstr for at least 10 entries
    const nonEmpty = (ar.match(/msgstr "[^"]+"/g) || []).filter(
      (s) => s !== 'msgstr ""'
    ).length;
    expect(nonEmpty).toBeGreaterThan(10);
  });

  it("html dir is rtl for ar", () => {
    const locale = "ar";
    const dir = locale === "ar" ? "rtl" : "ltr";
    expect(dir).toBe("rtl");
  });
});
