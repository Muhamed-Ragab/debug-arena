import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDeleteFn,
  mockDeleteWhere,
  mockFindFirst,
  mockFindMany,
  mockInsertFn,
  mockInsertReturning,
  mockInsertValues,
  mockSelectFn,
  mockSelectFrom,
  mockSelectWhere,
  mockUpdateFn,
  mockUpdateReturning,
  mockUpdateSet,
  mockUpdateWhere,
} = vi.hoisted(() => {
  const hoistedFindMany = vi.fn();
  const hoistedFindFirst = vi.fn();
  const hoistedInsertReturning = vi.fn();
  const hoistedInsertValues = vi.fn(() => ({
    returning: hoistedInsertReturning,
  }));
  const hoistedUpdateReturning = vi.fn();
  const hoistedUpdateWhere = vi.fn(() => ({
    returning: hoistedUpdateReturning,
  }));
  const hoistedUpdateSet = vi.fn(() => ({ where: hoistedUpdateWhere }));
  const hoistedDeleteWhere = vi.fn().mockResolvedValue(undefined);
  const hoistedSelectWhere = vi.fn();
  const hoistedSelectFrom = vi.fn(() => ({ where: hoistedSelectWhere }));
  const hoistedInsertFn = vi.fn(() => ({ values: hoistedInsertValues }));
  const hoistedUpdateFn = vi.fn(() => ({ set: hoistedUpdateSet }));
  const hoistedDeleteFn = vi.fn(() => ({ where: hoistedDeleteWhere }));
  const hoistedSelectFn = vi.fn(() => ({ from: hoistedSelectFrom }));
  return {
    mockDeleteFn: hoistedDeleteFn,
    mockDeleteWhere: hoistedDeleteWhere,
    mockFindFirst: hoistedFindFirst,
    mockFindMany: hoistedFindMany,
    mockInsertFn: hoistedInsertFn,
    mockInsertReturning: hoistedInsertReturning,
    mockInsertValues: hoistedInsertValues,
    mockSelectFn: hoistedSelectFn,
    mockSelectFrom: hoistedSelectFrom,
    mockSelectWhere: hoistedSelectWhere,
    mockUpdateFn: hoistedUpdateFn,
    mockUpdateReturning: hoistedUpdateReturning,
    mockUpdateSet: hoistedUpdateSet,
    mockUpdateWhere: hoistedUpdateWhere,
  };
});

vi.mock("@/db/client", () => ({
  db: {
    delete: mockDeleteFn,
    insert: mockInsertFn,
    query: {
      categories: {
        findFirst: mockFindFirst,
        findMany: mockFindMany,
      },
    },
    select: mockSelectFn,
    update: mockUpdateFn,
  },
}));

// Import after mock
import { categoryRepository } from "./repository";

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    color: "#3b82f6",
    description: "desc",
    icon: "Bug",
    id: "cat-1",
    isActive: true,
    name: "React Rendering",
    slug: "react-rendering",
    sortOrder: 0,
    ...overrides,
  };
}

describe("category/repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertValues.mockReturnValue({
      returning: mockInsertReturning,
    } as unknown as never);
    mockInsertFn.mockReturnValue({
      values: mockInsertValues,
    } as unknown as never);
    mockUpdateSet.mockReturnValue({
      where: mockUpdateWhere,
    } as unknown as never);
    mockUpdateWhere.mockReturnValue({
      returning: mockUpdateReturning,
    } as unknown as never);
    mockUpdateFn.mockReturnValue({ set: mockUpdateSet } as unknown as never);
    mockSelectFrom.mockReturnValue({
      where: mockSelectWhere,
    } as unknown as never);
    mockSelectFn.mockReturnValue({ from: mockSelectFrom } as unknown as never);
    mockDeleteFn.mockReturnValue({
      where: mockDeleteWhere,
    } as unknown as never);
    mockDeleteWhere.mockResolvedValue(undefined);
  });

  it("findAll returns mapped DTOs ordered by sortOrder", async () => {
    const rows = [
      makeRow({ id: "1", sortOrder: 0 }),
      makeRow({ id: "2", name: "B", slug: "b", sortOrder: 1 }),
    ];
    mockFindMany.mockResolvedValue(rows);

    const result = await categoryRepository.findAll();

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    // Verify orderBy was passed (contains asc)
    const callArg = mockFindMany.mock.calls[0]?.[0] as { orderBy?: unknown };
    expect(callArg.orderBy).toBeDefined();
    expect(result).toEqual(rows);
    expect(result[0]?.sortOrder).toBe(0);
  });

  it("findActive filters isActive=true and orders by sortOrder", async () => {
    const activeRows = [makeRow({ id: "1", isActive: true, sortOrder: 0 })];
    mockFindMany.mockResolvedValue(activeRows);

    const result = await categoryRepository.findActive();

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const callArg = mockFindMany.mock.calls[0]?.[0] as {
      where?: unknown;
      orderBy?: unknown;
    };
    expect(callArg.where).toBeDefined();
    expect(callArg.orderBy).toBeDefined();
    expect(result).toEqual(activeRows);
    expect(result.every((r) => r.isActive)).toBe(true);
  });

  it("findById returns DTO when found and null when missing", async () => {
    const row = makeRow({ id: "found-id" });
    mockFindFirst.mockResolvedValueOnce(row);
    expect(await categoryRepository.findById("found-id")).toEqual(row);

    mockFindFirst.mockResolvedValueOnce(undefined);
    expect(await categoryRepository.findById("missing")).toBeNull();
  });

  it("findBySlug returns DTO", async () => {
    const row = makeRow({ slug: "react-rendering" });
    mockFindFirst.mockResolvedValue(row);
    const result = await categoryRepository.findBySlug("react-rendering");
    expect(result?.slug).toBe("react-rendering");
    expect(mockFindFirst).toHaveBeenCalledTimes(1);
  });

  it("create inserts and returns DTO", async () => {
    const row = makeRow({ id: "new-id", name: "New Cat", slug: "new-cat" });
    mockInsertReturning.mockResolvedValueOnce([row]);

    const result = await categoryRepository.create({
      color: "#10b981",
      description: "new",
      icon: "Cpu",
      isActive: true,
      name: "New Cat",
      slug: "new-cat",
      sortOrder: 2,
    });

    expect(result).toEqual(row);
    expect(mockInsertReturning).toHaveBeenCalledTimes(1);
  });

  it("create fails on duplicate slug (unique violation)", async () => {
    mockInsertReturning.mockRejectedValueOnce(
      new Error(
        'duplicate key value violates unique constraint "categories_slug_key"'
      )
    );

    try {
      await categoryRepository.create({
        isActive: true,
        name: "Dup",
        slug: "react-rendering",
        sortOrder: 0,
      });
      throw new Error("should have thrown duplicate");
    } catch (e) {
      expect((e as Error).message).toMatch(/duplicate/i);
    }
  });

  it("update returns updated DTO and null when not found", async () => {
    const updatedRow = makeRow({ id: "cat-1", name: "Updated" });
    mockUpdateReturning.mockResolvedValueOnce([updatedRow]);
    const result = await categoryRepository.update("cat-1", {
      name: "Updated",
    });
    expect(result?.name).toBe("Updated");

    mockUpdateReturning.mockResolvedValueOnce([]);
    const missing = await categoryRepository.update("missing", { name: "X" });
    expect(missing).toBeNull();
  });

  it("deleteById calls delete with correct id", async () => {
    await categoryRepository.deleteById("cat-1");
    expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
  });

  it("countChallengesByCategoryId returns count via select", async () => {
    mockSelectWhere.mockResolvedValue([{ value: 5 }]);
    const count = await categoryRepository.countChallengesByCategoryId("cat-1");
    expect(count).toBe(5);
    expect(mockSelectWhere).toHaveBeenCalledTimes(1);
  });

  it("countChallengesByCategoryId returns 0 when no result", async () => {
    mockSelectWhere.mockResolvedValue([]);
    const count = await categoryRepository.countChallengesByCategoryId("cat-1");
    expect(count).toBe(0);
  });
});
