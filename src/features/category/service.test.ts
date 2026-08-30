import { describe, expect, it, vi } from "vitest";
import { ActionError, ConflictError } from "@/lib/safe-action";
import { createCategoryService, slugify } from "./service";
import type { CategoryRepository } from "./types";

const UUID_1 = "550e8400-e29b-41d4-a716-446655440001";
const UUID_2 = "550e8400-e29b-41d4-a716-446655440002";
const UUID_OTHER = "550e8400-e29b-41d4-a716-446655440099";

function createMockRepo(overrides: Partial<CategoryRepository> = {}) {
  return {
    countChallengesByCategoryId: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockImplementation((input) =>
      Promise.resolve({
        color: input.color ?? null,
        description: input.description ?? null,
        icon: input.icon ?? null,
        id: "new-id",
        isActive: input.isActive ?? true,
        name: input.name,
        slug: input.slug,
        sortOrder: input.sortOrder ?? 0,
      })
    ),
    deleteById: vi.fn().mockResolvedValue(undefined),
    findActive: vi.fn().mockResolvedValue([]),
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findBySlug: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockImplementation((id, input) => {
      const data = (input as unknown as Record<string, unknown>).data
        ? ((input as unknown as Record<string, unknown>).data as Record<
            string,
            unknown
          >)
        : (input as unknown as Record<string, unknown>);
      return Promise.resolve({
        color: (data.color as string | null) ?? null,
        description: (data.description as string | null) ?? null,
        icon: (data.icon as string | null) ?? null,
        id,
        isActive: (data.isActive as boolean) ?? true,
        name: (data.name as string) ?? "Updated",
        slug: (data.slug as string) ?? "updated",
        sortOrder: (data.sortOrder as number) ?? 0,
      });
    }),
    ...overrides,
  } as unknown as CategoryRepository & Record<string, ReturnType<typeof vi.fn>>;
}

describe("category/service", () => {
  it("slugify lowercases, replaces spaces, strips non-alphanum, collapses dashes", () => {
    expect(slugify("React Rendering")).toBe("react-rendering");
    expect(slugify("  Hello  World!! ")).toBe("hello-world");
    expect(slugify("API   Design__Test")).toBe("api-design-test");
    expect(slugify("---foo---bar---")).toBe("foo-bar");
    expect(slugify("C++ & Rust")).toBe("c-rust");
  });

  it("create success with DIP mock", async () => {
    const repo = createMockRepo();
    const svc = createCategoryService(repo);
    const result = await svc.createCategory({
      name: "React Rendering",
      slug: "react-rendering",
    });
    expect(result.slug).toBe("react-rendering");
    expect(repo.findBySlug).toHaveBeenCalledWith("react-rendering");
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it("create auto-generates slug via slugify when missing", async () => {
    const repo = createMockRepo();
    const svc = createCategoryService(repo);
    const result = await svc.createCategory({
      name: "Backend Concurrency",
    } as never);
    expect((result as unknown as Record<string, unknown>).slug).toBe(
      "backend-concurrency"
    );
    expect(repo.findBySlug).toHaveBeenCalledWith("backend-concurrency");
  });

  it("create duplicate slug → 409", async () => {
    const repo = createMockRepo({
      findBySlug: vi.fn().mockResolvedValue({
        id: "existing",
        slug: "react-rendering",
      } as never),
    });
    const svc = createCategoryService(repo);
    await expect(
      svc.createCategory({
        name: "React Rendering",
        slug: "react-rendering",
      } as never)
    ).rejects.toThrow(ConflictError);
    await expect(
      svc.createCategory({
        name: "React Rendering",
        slug: "react-rendering",
      } as never)
    ).rejects.toSatisfy((err: unknown) => {
      if (!(err instanceof ConflictError)) {
        return false;
      }
      return (
        err.message === "error.categorySlugExists" &&
        err.code === "CONFLICT" &&
        err.status === 409
      );
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("ensureUniqueSlug throws 409 when slug exists (create path)", async () => {
    const repo = createMockRepo({
      findBySlug: vi
        .fn()
        .mockResolvedValue({ id: UUID_OTHER, slug: "dup" } as never),
    });
    const svc = createCategoryService(repo);
    await expect(svc.ensureUniqueSlug("dup")).rejects.toThrow(ConflictError);
    await expect(svc.ensureUniqueSlug("dup")).rejects.toSatisfy(
      (err: unknown) => {
        if (!(err instanceof ConflictError)) {
          return false;
        }
        return err.code === "CONFLICT" && err.status === 409;
      }
    );
    // also ensures ConflictError extends ActionError for handleServerError compat
    try {
      await svc.ensureUniqueSlug("dup");
    } catch (e) {
      expect(e).toBeInstanceOf(ActionError);
      expect(e).toBeInstanceOf(ConflictError);
    }
  });

  it("update success when slug unchanged or unique", async () => {
    const repo = createMockRepo({
      findBySlug: vi.fn().mockResolvedValue(null),
    });
    const svc = createCategoryService(repo);
    const result = await svc.updateCategory(UUID_1, {
      name: "Updated Name",
      slug: "updated-name",
    } as never);
    expect(result?.id).toBe(UUID_1);
    expect(repo.findBySlug).toHaveBeenCalledWith("updated-name");
    expect(repo.update).toHaveBeenCalledWith(
      UUID_1,
      expect.objectContaining({ slug: "updated-name" })
    );
  });

  it("update duplicate slug with different id → 409", async () => {
    const repo = createMockRepo({
      findBySlug: vi.fn().mockResolvedValue({
        id: UUID_OTHER,
        slug: "react-rendering",
      } as never),
    });
    const svc = createCategoryService(repo);
    let err: unknown;
    try {
      await svc.updateCategory(UUID_1, { slug: "react-rendering" } as never);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ConflictError);
    expect(err).toBeInstanceOf(ActionError);
    expect((err as Error).message).toBe("error.categorySlugExists");
    expect((err as ConflictError).code).toBe("CONFLICT");
    expect((err as ConflictError).status).toBe(409);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("update same id slug does not throw (excludeId path)", async () => {
    const repo = createMockRepo({
      findBySlug: vi
        .fn()
        .mockResolvedValue({ id: UUID_1, slug: "react-rendering" } as never),
    });
    const svc = createCategoryService(repo);
    await expect(
      svc.updateCategory(UUID_1, { slug: "react-rendering" } as never)
    ).resolves.toBeTruthy();
  });

  it("delete blocked 409 when challenges linked", async () => {
    const repo = createMockRepo({
      countChallengesByCategoryId: vi.fn().mockResolvedValue(3),
    });
    const svc = createCategoryService(repo);
    await expect(svc.deleteCategory(UUID_1)).rejects.toThrow(ConflictError);
    await expect(svc.deleteCategory(UUID_1)).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof ConflictError &&
        (err as Error).message === "error.cannotDeleteCategory" &&
        (err as ConflictError).code === "CONFLICT"
    );
    expect(repo.deleteById).not.toHaveBeenCalled();
    try {
      await svc.deleteCategory(UUID_1);
    } catch (e) {
      expect(e).toBeInstanceOf(ConflictError);
      expect((e as ConflictError).status).toBe(409);
    }
  });

  it("delete success when 0 challenges", async () => {
    const repo = createMockRepo({
      countChallengesByCategoryId: vi.fn().mockResolvedValue(0),
    });
    const svc = createCategoryService(repo);
    await svc.deleteCategory(UUID_2);
    expect(repo.deleteById).toHaveBeenCalledWith(UUID_2);
  });

  it("getActive filters via repo.findActive", async () => {
    const active = [{ id: "1", isActive: true, name: "A", slug: "a" } as never];
    const repo = createMockRepo({
      findActive: vi.fn().mockResolvedValue(active),
    });
    const svc = createCategoryService(repo);
    const result = await svc.getActiveCategories();
    expect(repo.findActive).toHaveBeenCalledOnce();
    expect(result).toEqual(active);
  });

  it("getAllCategories delegates to repo.findAll", async () => {
    const all = [{ id: "1" } as never, { id: "2" } as never];
    const repo = createMockRepo({
      findAll: vi.fn().mockResolvedValue(all),
    });
    const svc = createCategoryService(repo);
    const result = await svc.getAllCategories();
    expect(repo.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual(all);
  });

  it("create does not Zod-validate at service layer — delegates to repo (action layer handles Zod)", async () => {
    const repo = createMockRepo();
    const svc = createCategoryService(repo);
    // Service intentionally does not enforce Zod min(2); validation is at safe-action inputSchema
    const result = await svc.createCategory({ name: "A", slug: "a" } as never);
    expect(repo.create).toHaveBeenCalledOnce();
    expect((result as unknown as Record<string, unknown>).name).toBe("A");
  });
});
