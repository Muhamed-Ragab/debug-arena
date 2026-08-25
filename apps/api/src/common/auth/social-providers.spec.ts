import { describe, expect, it } from "vitest";
import { buildSocialProviders } from "./social-providers";

describe("buildSocialProviders", () => {
  it("returns empty object when no provider env vars are set", () => {
    const result = buildSocialProviders({});
    expect(result).toEqual({});
  });

  it("configures google when both google vars present", () => {
    const result = buildSocialProviders({
      GOOGLE_CLIENT_ID: "g-id",
      GOOGLE_CLIENT_SECRET: "g-secret",
    });
    expect(result.google).toEqual({ clientId: "g-id", clientSecret: "g-secret" });
    expect(result.github).toBeUndefined();
  });

  it("configures github when both github vars present", () => {
    const result = buildSocialProviders({
      GITHUB_CLIENT_ID: "gh-id",
      GITHUB_CLIENT_SECRET: "gh-secret",
    });
    expect(result.github).toEqual({ clientId: "gh-id", clientSecret: "gh-secret" });
  });

  it("skips a provider when only one of its two vars is set", () => {
    const result = buildSocialProviders({ GOOGLE_CLIENT_ID: "g-id" });
    expect(result).toEqual({});
  });

  it("configures both providers together", () => {
    const result = buildSocialProviders({
      GOOGLE_CLIENT_ID: "g-id",
      GOOGLE_CLIENT_SECRET: "g-secret",
      GITHUB_CLIENT_ID: "gh-id",
      GITHUB_CLIENT_SECRET: "gh-secret",
    });
    expect(Object.keys(result).sort()).toEqual(["github", "google"]);
  });
});
