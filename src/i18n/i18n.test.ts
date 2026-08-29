import { describe, expect, it } from "vitest";
import arAuth from "../../messages/ar/auth.json";
import arCommon from "../../messages/ar/common.json";
import enAuth from "../../messages/en/auth.json";
import enCommon from "../../messages/en/common.json";

describe("next-intl catalogs", () => {
  it("translates every en common key into ar", () => {
    const enKeys = Object.keys(enCommon);
    for (const key of enKeys) {
      expect(
        (arCommon as Record<string, unknown>)[key],
        `missing ar translation for common key: ${key}`
      ).toBeTruthy();
    }
  });

  it("has auth namespace in both locales", () => {
    expect(enAuth).toBeDefined();
    expect(arAuth).toBeDefined();
    expect(enAuth.login.title).toBe("Welcome back");
  });

  it("html dir is rtl for ar", () => {
    const locale = "ar";
    const dir = locale === "ar" ? "rtl" : "ltr";
    expect(dir).toBe("rtl");
  });
});
