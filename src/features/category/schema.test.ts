import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  categories as categoriesFromChallenge,
  challenges,
} from "@/features/challenge/schema";
import { categories } from "./schema";

describe("category/schema", () => {
  it("exports categories table with 8 columns", () => {
    const cols = Object.keys(categories);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "name",
        "slug",
        "description",
        "icon",
        "color",
        "sortOrder",
        "isActive",
      ])
    );
    expect(Object.keys(categories).length).toBeGreaterThanOrEqual(8);
  });

  it("has correct column configs with defaults", () => {
    const cfg = getTableConfig(categories);
    const colMap = Object.fromEntries(cfg.columns.map((c) => [c.name, c]));
    expect(colMap.id).toBeDefined();
    expect(colMap.name?.notNull).toBe(true);
    expect(colMap.slug?.notNull).toBe(true);
    expect(colMap.description?.notNull).toBe(false);
    expect(colMap.icon?.notNull).toBe(false);
    expect(colMap.color?.notNull).toBe(false);
    expect(colMap.sort_order?.notNull).toBe(true);
    expect(colMap.sort_order?.default?.toString()).toContain("0");
    expect(colMap.is_active?.notNull).toBe(true);
    expect(colMap.is_active?.default?.toString()).toContain("true");
  });

  it("has 2 RLS policies", () => {
    const cfg = getTableConfig(categories);
    const policies = cfg.policies ?? [];
    expect(policies.length).toBe(2);
    const names = policies.map((p) => (p as unknown as { name: string }).name);
    expect(names).toEqual(
      expect.arrayContaining(["admin_all_categories", "user_read_categories"])
    );
  });

  it("re-export from challenge/schema matches category/schema", () => {
    expect(categoriesFromChallenge).toBe(categories);
  });

  it("challenges.categoryId references categories.id with RESTRICT", () => {
    const cfg = getTableConfig(challenges);
    const fk = cfg.foreignKeys.find((k) => k.onDelete === "restrict");
    expect(fk).toBeDefined();
    expect(fk?.onDelete).toBe("restrict");
    const ref = fk?.reference();
    expect(ref?.foreignColumns[0]?.name).toBe("id");
    expect(Object.keys(challenges)).toContain("categoryId");
  });

  it("no duplicate table definition - single categories export", () => {
    const cfg = getTableConfig(categories);
    expect(cfg.name).toBe("categories");
  });
});
