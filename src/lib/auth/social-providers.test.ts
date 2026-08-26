import { describe, expect, it } from "vitest";
import { buildSocialProviders } from "./social-providers";

describe("buildSocialProviders", () => {
  it("returns configured social providers based on env", () => {
    const providers = buildSocialProviders();
    expect(typeof providers).toBe("object");
  });
});
