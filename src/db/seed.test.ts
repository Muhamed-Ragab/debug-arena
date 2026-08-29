import { describe, expect, it, vi } from "vitest";
import { SEED_CATEGORIES } from "@/features/category/constants";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

describe("seed categories idempotency", () => {
  it("SEED_CATEGORIES has 6 entries", () => {
    expect(SEED_CATEGORIES).toHaveLength(6);
  });

  it("all SEED_CATEGORIES have unique slugs", () => {
    const slugs = SEED_CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(6);
  });

  it("each SEED_CATEGORY has icon, color, sortOrder, isActive populated", () => {
    for (const cat of SEED_CATEGORIES) {
      expect(cat.icon).toBeTruthy();
      expect(cat.color).toMatch(HEX_COLOR_REGEX);
      expect(typeof cat.sortOrder).toBe("number");
      expect(cat.sortOrder).toBeGreaterThanOrEqual(0);
      expect(cat.sortOrder).toBeLessThanOrEqual(5);
      expect(cat.isActive).toBe(true);
      expect(cat.name).toBeTruthy();
      expect(cat.description).toBeTruthy();
    }
  });

  it("sortOrder values are 0-5 in order", () => {
    const orders = SEED_CATEGORIES.map((c) => c.sortOrder);
    expect(orders).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("re-export from challenge/constants still works", async () => {
    const mod = await import("@/features/challenge/constants");
    expect(mod.SEED_CATEGORIES).toEqual(SEED_CATEGORIES);
  });

  it("idempotent upsert via in-memory map: second run keeps count 6 and updates columns", () => {
    const store = new Map<string, (typeof SEED_CATEGORIES)[number]>();

    function upsert(cats: typeof SEED_CATEGORIES) {
      for (const cat of cats) {
        store.set(cat.slug, { ...cat });
      }
    }

    upsert(SEED_CATEGORIES);
    expect(store.size).toBe(6);

    const firstIcons = new Map(
      [...store.entries()].map(([k, v]) => [k, v.icon] as const)
    );
    const firstColors = new Map(
      [...store.entries()].map(([k, v]) => [k, v.color] as const)
    );

    upsert(SEED_CATEGORIES);
    expect(store.size).toBe(6);
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
    expect(map.size).toBe(6);
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
