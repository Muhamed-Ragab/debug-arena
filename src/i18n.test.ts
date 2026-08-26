import { i18n } from "@lingui/core";
import { describe, expect, it } from "vitest";
import { dynamicActivate } from "./i18n";
import { messages as ar } from "./locales/ar/messages";
import { messages as en } from "./locales/en/messages";

describe("i18n catalogs", () => {
  it("translates every en key into ar", () => {
    const enKeys = Object.keys(en);
    for (const key of enKeys) {
      expect(
        (ar as Record<string, string>)[key],
        `missing ar translation for key: ${key}`
      ).toBeTruthy();
    }
  });

  it("dynamically activates en locale", async () => {
    await dynamicActivate("en");
    expect(i18n.locale).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });

  it("dynamically activates ar locale and sets rtl direction", async () => {
    await dynamicActivate("ar");
    expect(i18n.locale).toBe("ar");
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });
});
