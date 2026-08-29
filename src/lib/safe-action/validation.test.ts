import { describe, expect, it } from "vitest";
import {
  flattenValidationErrors,
  getFirstValidationMessage,
} from "./validation";

describe("flattenValidationErrors", () => {
  it("returns empty for null/undefined/non-object", () => {
    expect(flattenValidationErrors(null)).toEqual({});
    expect(flattenValidationErrors(undefined)).toEqual({});
    expect(flattenValidationErrors("string")).toEqual({});
    expect(flattenValidationErrors(42)).toEqual({});
  });

  it("handles flattened shape with fieldErrors and formErrors", () => {
    const input = {
      fieldErrors: {
        difficulty: [],
        prompt: ["Prompt too short"],
        title: ["Title is required"],
      },
      formErrors: ["Form level error"],
    };
    const out = flattenValidationErrors(input);
    expect(out.title).toBe("Title is required");
    expect(out.prompt).toBe("Prompt too short");
    expect(out.difficulty).toBeUndefined();
    expect(out._errors).toBe("Form level error");
  });

  it("handles flattened shape with _errors fallback", () => {
    const input = {
      _errors: ["Top level _errors"],
      fieldErrors: {
        slug: ["Slug required"],
      },
    };
    const out = flattenValidationErrors(input);
    expect(out.slug).toBe("Slug required");
    expect(out._errors).toBe("Top level _errors");
  });

  it("prefers formErrors over _errors when both present", () => {
    const input = {
      _errors: ["_err"],
      fieldErrors: {},
      formErrors: ["form err"],
    };
    const out = flattenValidationErrors(input);
    expect(out._errors).toBe("form err");
  });

  it("handles default shape with _errors inside fields", () => {
    const input = {
      _errors: ["General error"],
      prompt: { _errors: ["Prompt invalid"] },
      title: { _errors: ["Title invalid"] },
    };
    const out = flattenValidationErrors(input);
    expect(out.title).toBe("Title invalid");
    expect(out.prompt).toBe("Prompt invalid");
    expect(out._errors).toBe("General error");
  });

  it("handles default shape with direct string[] fallback", () => {
    const input = {
      bio: ["Bio too long"],
      username: ["Username required"],
    };
    const out = flattenValidationErrors(input);
    expect(out.username).toBe("Username required");
    expect(out.bio).toBe("Bio too long");
  });

  it("ignores empty arrays and non-string entries", () => {
    const input = {
      fieldErrors: {
        displayName: [123 as unknown as string],
        name: [],
      },
      formErrors: [],
    };
    const out = flattenValidationErrors(input);
    expect(out.name).toBeUndefined();
    expect(out.displayName).toBeUndefined();
    expect(out._errors).toBeUndefined();
  });
});

describe("getFirstValidationMessage", () => {
  it("returns preferred key in priority order", () => {
    const flat: Record<string, string | undefined> = {
      bio: "bio msg",
      prompt: "prompt msg",
      title: "title msg",
    };
    // preferred order: rootCauseExplanation, localizationLines, title, prompt...
    expect(getFirstValidationMessage(flat)).toBe("title msg");

    const flat2: Record<string, string | undefined> = {
      avatarUrl: "avatar",
      bio: "bio",
    };
    expect(getFirstValidationMessage(flat2)).toBe("bio");

    const flat3: Record<string, string | undefined> = {
      challengeId: "cid",
      slug: "slug msg",
    };
    expect(getFirstValidationMessage(flat3)).toBe("slug msg");
  });

  it("returns _errors when no preferred match", () => {
    const flat: Record<string, string | undefined> = {
      _errors: "general",
      other: "other",
    };
    expect(getFirstValidationMessage(flat)).toBe("general");
  });

  it("returns first value when no preferred nor _errors", () => {
    const flat: Record<string, string | undefined> = {
      customField: "custom",
    };
    expect(getFirstValidationMessage(flat)).toBe("custom");
  });

  it("returns null for empty record", () => {
    expect(getFirstValidationMessage({})).toBeNull();
  });

  it("handles undefined values correctly", () => {
    const flat: Record<string, string | undefined> = {
      prompt: "valid prompt",
      slug: undefined,
      title: undefined,
    };
    expect(getFirstValidationMessage(flat)).toBe("valid prompt");
  });
});
