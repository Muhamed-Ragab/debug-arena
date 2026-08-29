import { describe, expect, it } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
  it("has en and ar locales with en default and never prefix", () => {
    expect(routing.locales).toEqual(["en", "ar"]);
    expect(routing.defaultLocale).toBe("en");
    expect(routing.localePrefix).toBe("never");
  });

  it("contains required locales", () => {
    expect(routing.locales).toContain("en");
    expect(routing.locales).toContain("ar");
  });
});
