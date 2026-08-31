import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasConsentForLastLogin } from "@/lib/consent/hasConsent";

describe("consent gate for lastLoginMethod", () => {
  it("beforeStoreCookie returns false when no consent", () => {
    const header = "";
    expect(hasConsentForLastLogin(header)).toBe(false);
  });

  it("beforeStoreCookie returns true when granted", () => {
    expect(hasConsentForLastLogin("app_consent=granted")).toBe(true);
  });
});

describe("lastLoginMethod client helpers", () => {
  beforeEach(() => {
    // jsdom document.cookie
    document.cookie = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.cookie = "";
  });

  it("reads last used login method from cookie", async () => {
    document.cookie = "better-auth.last_used_login_method=github";
    const { lastLoginMethodClient } = await import(
      "better-auth/client/plugins"
    );
    const client = lastLoginMethodClient();
    const actions = (
      client as unknown as {
        getActions: () => Record<string, (...args: unknown[]) => unknown>;
      }
    ).getActions();
    expect(actions.getLastUsedLoginMethod()).toBe("github");
    expect(actions.isLastUsedLoginMethod("github")).toBe(true);
    expect(actions.isLastUsedLoginMethod("google")).toBe(false);
  });

  it("clearLastUsedLoginMethod expires cookie", async () => {
    document.cookie = "better-auth.last_used_login_method=email";
    const { lastLoginMethodClient } = await import(
      "better-auth/client/plugins"
    );
    const client = lastLoginMethodClient();
    const actions = (
      client as unknown as {
        getActions: () => Record<string, (...args: unknown[]) => unknown>;
      }
    ).getActions();
    (actions.clearLastUsedLoginMethod as () => void)();
    // After clearing, cookie should not contain value
    // jsdom sets cookie with past expiry which removes it; parse manually
    const cookies = document.cookie;
    expect(cookies).not.toContain("better-auth.last_used_login_method=email");
  });
});

describe("HIBP plugin registration", () => {
  it("haveIBeenPwned enabled flag is false in test env", async () => {
    const { haveIBeenPwned } = await import("better-auth/plugins");
    const plugin = haveIBeenPwned({ enabled: false });
    expect(plugin.id).toBe("have-i-been-pwned");
    expect(plugin.options?.enabled).toBe(false);
  });

  it("lastLoginMethod schema maps to snake_case", async () => {
    const { lastLoginMethod } = await import("better-auth/plugins");
    const plugin = lastLoginMethod({
      schema: { user: { lastLoginMethod: "last_login_method" } },
      storeInDatabase: true,
    });
    // schema is only defined when storeInDatabase true
    expect(plugin.schema).toBeDefined();
    if (plugin.schema) {
      const field = (
        plugin.schema as unknown as {
          user: { fields: { lastLoginMethod: { fieldName: string } } };
        }
      ).user.fields.lastLoginMethod.fieldName;
      expect(field).toBe("last_login_method");
    }
  });
});
