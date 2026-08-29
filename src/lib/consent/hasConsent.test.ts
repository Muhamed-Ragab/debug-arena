import { describe, expect, it } from "vitest";
import { hasConsentForLastLogin } from "./hasConsent";

describe("hasConsentForLastLogin", () => {
  it("returns false for empty header", () => {
    expect(hasConsentForLastLogin("")).toBe(false);
  });

  it("returns true for app_consent=granted", () => {
    expect(hasConsentForLastLogin("app_consent=granted")).toBe(true);
  });

  it("returns true for consent=granted", () => {
    expect(hasConsentForLastLogin("consent=granted")).toBe(true);
  });

  it("returns true for last_login_consent=1", () => {
    expect(hasConsentForLastLogin("last_login_consent=1")).toBe(true);
  });

  it("returns false for denied consent", () => {
    expect(hasConsentForLastLogin("app_consent=denied")).toBe(false);
    expect(hasConsentForLastLogin("consent=denied")).toBe(false);
  });

  it("handles multiple cookies", () => {
    expect(
      hasConsentForLastLogin("foo=bar; app_consent=granted; baz=qux")
    ).toBe(true);
    expect(hasConsentForLastLogin("foo=bar; baz=qux")).toBe(false);
  });

  it("rejects granted_extra as false positive", () => {
    expect(hasConsentForLastLogin("app_consent=granted_extra")).toBe(false);
    expect(hasConsentForLastLogin("consent=granted_extra")).toBe(false);
    expect(hasConsentForLastLogin("last_login_consent=10")).toBe(false);
    expect(hasConsentForLastLogin("last_login_consent=1_extra")).toBe(false);
  });

  it("handles trailing semicolon and spaces", () => {
    expect(hasConsentForLastLogin("app_consent=granted;")).toBe(true);
    expect(hasConsentForLastLogin("app_consent=granted ; foo=bar")).toBe(true);
    expect(hasConsentForLastLogin("last_login_consent=1;")).toBe(true);
    expect(
      hasConsentForLastLogin("foo=bar; last_login_consent=1 ; baz=qux")
    ).toBe(true);
  });

  it("is case-sensitive and ignores prefix tricks", () => {
    expect(hasConsentForLastLogin("xapp_consent=granted")).toBe(false);
    expect(hasConsentForLastLogin("my_consent=granted")).toBe(false);
    expect(hasConsentForLastLogin("APP_CONSENT=granted")).toBe(false);
  });
});
