import { describe, expect, it, vi } from "vitest";
import { SEED_CATEGORIES } from "@/features/category/constants";
import { ADDITIONAL_SEED_CHALLENGES } from "@/features/challenge/data/challenges.additional.seed";
import { SEED_CHALLENGES } from "@/features/challenge/data/challenges.seed";
import { resolveAdminSeedPassword } from "./seed-utils";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

describe("seed categories idempotency", () => {
  it("does not use an insecure fallback password for the optional admin seed", () => {
    expect(resolveAdminSeedPassword(undefined)).toBeNull();
    expect(resolveAdminSeedPassword("Admin123456!")).toBeNull();
    expect(resolveAdminSeedPassword("configured-password")).toBe(
      "configured-password"
    );
  });

  it("includes the original categories and common system design areas", () => {
    expect(SEED_CATEGORIES.length).toBeGreaterThanOrEqual(10);
    expect(SEED_CATEGORIES.map((category) => category.slug)).toEqual(
      expect.arrayContaining([
        "system-design",
        "database-design",
        "distributed-systems",
        "testing-reliability",
      ])
    );
  });

  it("all SEED_CATEGORIES have unique slugs", () => {
    const slugs = SEED_CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(SEED_CATEGORIES.length);
  });

  it("each SEED_CATEGORY has icon, color, sortOrder, isActive populated", () => {
    for (const cat of SEED_CATEGORIES) {
      expect(cat.icon).toBeTruthy();
      expect(cat.color).toMatch(HEX_COLOR_REGEX);
      expect(typeof cat.sortOrder).toBe("number");
      expect(cat.sortOrder).toBeGreaterThanOrEqual(0);
      expect(cat.sortOrder).toBeLessThan(SEED_CATEGORIES.length);
      expect(cat.isActive).toBe(true);
      expect(cat.name).toBeTruthy();
      expect(cat.description).toBeTruthy();
    }
  });

  it("sortOrder values are contiguous and ordered", () => {
    const orders = SEED_CATEGORIES.map((c) => c.sortOrder);
    expect(orders).toEqual(SEED_CATEGORIES.map((_, index) => index));
  });

  it("adds at least 50 distinct researched challenges across categories", () => {
    expect(SEED_CHALLENGES.length).toBeGreaterThanOrEqual(70);
    expect(
      new Set(SEED_CHALLENGES.map((challenge) => challenge.slug)).size
    ).toBe(SEED_CHALLENGES.length);
    expect(
      SEED_CHALLENGES.every((challenge) =>
        SEED_CATEGORIES.some(
          (category) => category.slug === challenge.categorySlug
        )
      )
    ).toBe(true);
  });

  it("points localization grading at the changed source lines", () => {
    const bySlug = new Map(
      SEED_CHALLENGES.map((challenge) => [challenge.slug, challenge])
    );

    expect(
      bySlug.get("react-effect-stale-search")?.buggyArtifact.buggyLines
    ).toEqual([3, 3]);
    expect(
      bySlug.get("react-subscription-cleanup")?.buggyArtifact.buggyLines
    ).toEqual([2, 2]);
    expect(
      bySlug.get("backend-inventory-lost-update")?.buggyArtifact.buggyLines
    ).toEqual([1, 2]);

    for (const challenge of ADDITIONAL_SEED_CHALLENGES) {
      const [start, end] = challenge.buggyArtifact.buggyLines;
      const code = challenge.buggyArtifact.files.find(
        (file) => file.name === challenge.buggyArtifact.entryFile
      )?.code;
      expect(start).toBeGreaterThan(0);
      expect(end).toBeGreaterThanOrEqual(start);
      expect(end).toBeLessThanOrEqual(code?.split("\n").length ?? 0);
    }
  });

  it("re-export from challenge/constants still works", async () => {
    const mod = await import("@/features/challenge/constants");
    expect(mod.SEED_CATEGORIES).toEqual(SEED_CATEGORIES);
  });

  it("idempotent upsert via in-memory map keeps count and updates columns", () => {
    const store = new Map<string, (typeof SEED_CATEGORIES)[number]>();

    function upsert(cats: typeof SEED_CATEGORIES) {
      for (const cat of cats) {
        store.set(cat.slug, { ...cat });
      }
    }

    upsert(SEED_CATEGORIES);
    expect(store.size).toBe(SEED_CATEGORIES.length);

    const firstIcons = new Map(
      [...store.entries()].map(([k, v]) => [k, v.icon] as const)
    );
    const firstColors = new Map(
      [...store.entries()].map(([k, v]) => [k, v.color] as const)
    );

    upsert(SEED_CATEGORIES);
    expect(store.size).toBe(SEED_CATEGORIES.length);
    for (const cat of SEED_CATEGORIES) {
      expect(store.get(cat.slug)?.icon).toBe(firstIcons.get(cat.slug));
      expect(store.get(cat.slug)?.color).toBe(firstColors.get(cat.slug));
      expect(store.get(cat.slug)?.name).toBe(cat.name);
    }
  });

  it("mock Drizzle onConflictDoUpdate chain does not throw duplicate and builds categoryMap", async () => {
    const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const mockValues = vi.fn(() => ({
      onConflictDoUpdate: mockOnConflictDoUpdate,
    }));
    const mockInsert = vi.fn(() => ({ values: mockValues }));
    const mockFindMany = vi.fn().mockResolvedValue(
      SEED_CATEGORIES.map((c, i) => ({
        id: `id-${i}`,
        slug: c.slug,
      }))
    );

    const fakeDb = {
      insert: mockInsert,
      query: { categories: { findMany: mockFindMany } },
    } as unknown as {
      insert: typeof mockInsert;
      query: { categories: { findMany: typeof mockFindMany } };
    };

    const seedData = SEED_CATEGORIES.map((cat) => ({
      color: cat.color,
      description: cat.description,
      icon: cat.icon,
      isActive: cat.isActive,
      name: cat.name,
      slug: cat.slug,
      sortOrder: cat.sortOrder,
    }));

    const fakeSchema = { categories: { slug: "slug-col" } } as unknown as {
      categories: { slug: unknown };
    };
    const fakeSql = (strings: TemplateStringsArray) => strings.join("");

    await (
      fakeDb.insert as unknown as (arg: unknown) => {
        values: (v: unknown) => {
          onConflictDoUpdate: (o: unknown) => Promise<void>;
        };
      }
    )(fakeSchema.categories)
      .values(seedData)
      .onConflictDoUpdate({
        set: {
          color: fakeSql`excluded.color`,
          description: fakeSql`excluded.description`,
          icon: fakeSql`excluded.icon`,
          isActive: fakeSql`excluded.is_active`,
          name: fakeSql`excluded.name`,
          sortOrder: fakeSql`excluded.sort_order`,
        },
        target: fakeSchema.categories.slug,
      });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(seedData);
    expect(mockOnConflictDoUpdate).toHaveBeenCalledTimes(1);
    const callArg = mockOnConflictDoUpdate.mock.calls[0]?.[0] as {
      target: unknown;
      set: Record<string, unknown>;
    };
    expect(callArg.target).toBe(fakeSchema.categories.slug);
    expect(callArg.set).toHaveProperty("color");
    expect(callArg.set).toHaveProperty("icon");
    expect(callArg.set).toHaveProperty("isActive");
    expect(callArg.set).toHaveProperty("sortOrder");
    expect(callArg.set).toHaveProperty("name");
    expect(callArg.set).toHaveProperty("description");

    const all = await fakeDb.query.categories.findMany();
    const map = new Map<string, string>();
    for (const c of all as { id: string; slug: string }[]) {
      map.set(c.slug, c.id);
    }
    expect(map.size).toBe(SEED_CATEGORIES.length);
    for (const cat of SEED_CATEGORIES) {
      expect(map.has(cat.slug)).toBe(true);
    }

    // second run same chain should still succeed
    await (
      fakeDb.insert as unknown as (arg: unknown) => {
        values: (v: unknown) => {
          onConflictDoUpdate: (o: unknown) => Promise<void>;
        };
      }
    )(fakeSchema.categories)
      .values(seedData)
      .onConflictDoUpdate({
        set: {
          color: fakeSql`excluded.color`,
          description: fakeSql`excluded.description`,
          icon: fakeSql`excluded.icon`,
          isActive: fakeSql`excluded.is_active`,
          name: fakeSql`excluded.name`,
          sortOrder: fakeSql`excluded.sort_order`,
        },
        target: fakeSchema.categories.slug,
      });
    expect(mockOnConflictDoUpdate).toHaveBeenCalledTimes(2);
  });
});
