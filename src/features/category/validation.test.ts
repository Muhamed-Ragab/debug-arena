import { describe, expect, it } from "vitest";
import { createCategorySchema, updateCategorySchema } from "./validation";

describe("category/validation", () => {
  it("validates a correct create payload with all fields", () => {
    const result = createCategorySchema.safeParse({
      color: "#3b82f6",
      description: "React rendering bugs",
      icon: "Bug",
      isActive: true,
      name: "React Rendering",
      slug: "react-rendering",
      sortOrder: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("React Rendering");
      expect(result.data.slug).toBe("react-rendering");
      expect(result.data.color).toBe("#3b82f6");
    }
  });

  it("applies defaults for sortOrder and isActive when omitted", () => {
    const result = createCategorySchema.safeParse({
      name: "Performance",
      slug: "performance",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe(0);
      expect(result.data.isActive).toBe(true);
    }
  });

  it("coerces string sortOrder to number", () => {
    const result = createCategorySchema.safeParse({
      name: "Security",
      slug: "security",
      sortOrder: "5" as unknown as number,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe(5);
    }
  });

  it("rejects invalid slug format (uppercase/underscore)", () => {
    const badSlugs = ["Invalid_Slug", "Has Space", "UPPERCASE", "bad_slug"];
    for (const slug of badSlugs) {
      const result = createCategorySchema.safeParse({
        name: "Test",
        slug,
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects invalid color hex", () => {
    const badColors = ["3b82f6", "#gggggg", "#12345", "red", "#12345G"];
    for (const color of badColors) {
      const result = createCategorySchema.safeParse({
        color,
        name: "Test",
        slug: "test-slug",
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects missing name", () => {
    const result = createCategorySchema.safeParse({
      slug: "no-name",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("name"))).toBe(
        true
      );
    }
  });

  it("rejects name too short and slug too short", () => {
    const shortName = createCategorySchema.safeParse({
      name: "A",
      slug: "valid-slug",
    });
    expect(shortName.success).toBe(false);

    const shortSlug = createCategorySchema.safeParse({
      name: "Valid Name",
      slug: "a",
    });
    expect(shortSlug.success).toBe(false);
  });

  it("rejects name/slug too long and description too long", () => {
    const longName = createCategorySchema.safeParse({
      name: "A".repeat(81),
      slug: "valid-slug",
    });
    expect(longName.success).toBe(false);

    const longSlug = createCategorySchema.safeParse({
      name: "Valid",
      slug: "a".repeat(51),
    });
    expect(longSlug.success).toBe(false);

    const longDesc = createCategorySchema.safeParse({
      description: "x".repeat(501),
      name: "Valid",
      slug: "valid-slug",
    });
    expect(longDesc.success).toBe(false);
  });

  it("updateCategorySchema allows partial payloads", () => {
    const result = updateCategorySchema.safeParse({
      data: { name: "Updated Name" },
      id: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);

    const empty = updateCategorySchema.safeParse({
      data: {},
      id: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(empty.success).toBe(true);

    const invalidPartial = updateCategorySchema.safeParse({
      data: { slug: "Bad_Slug" },
      id: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(invalidPartial.success).toBe(false);
  });

  it("rejects sortOrder out of range and non-integer", () => {
    expect(
      createCategorySchema.safeParse({
        name: "Test",
        slug: "test",
        sortOrder: -1,
      }).success
    ).toBe(false);

    expect(
      createCategorySchema.safeParse({
        name: "Test",
        slug: "test",
        sortOrder: 1001,
      }).success
    ).toBe(false);

    expect(
      createCategorySchema.safeParse({
        name: "Test",
        slug: "test",
        sortOrder: 1.5,
      }).success
    ).toBe(false);
  });

  it("accepts optional nullable icon/color/description", () => {
    const withNulls = createCategorySchema.safeParse({
      color: null,
      description: null,
      icon: null,
      name: "Test",
      slug: "test-nulls",
    });
    expect(withNulls.success).toBe(true);

    const omitted = createCategorySchema.safeParse({
      name: "Test",
      slug: "test-omitted",
    });
    expect(omitted.success).toBe(true);
  });
});
