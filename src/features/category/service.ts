import { ConflictError, NotFoundError } from "@/lib/safe-action";
import { categoryRepository } from "./repository";
import type {
  CategoryRepository,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./types";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createCategoryService(
  repo: CategoryRepository = categoryRepository
) {
  async function ensureUniqueSlug(
    slug: string,
    excludeId?: string
  ): Promise<void> {
    const existing = await repo.findBySlug(slug);
    if (!existing) {
      return;
    }
    if (excludeId && existing.id === excludeId) {
      return;
    }
    throw new ConflictError("error.categorySlugExists");
  }

  async function getAllCategories() {
    return await repo.findAll();
  }

  async function getCategoryById(id: string) {
    return await repo.findById(id);
  }

  async function getActiveCategories() {
    return await repo.findActive();
  }

  async function createCategory(input: CreateCategoryInput) {
    const slug = input.slug ?? slugify(input.name);
    const parsed = { ...input, slug };
    await ensureUniqueSlug(parsed.slug);

    return await repo.create(parsed);
  }

  async function updateCategory(
    id: UpdateCategoryInput["id"],
    input: UpdateCategoryInput["data"]
  ) {
    if (input.slug) {
      await ensureUniqueSlug(input.slug, id);
    }
    const result = await repo.update(id, input);
    if (!result) {
      throw new NotFoundError("error.categoryNotFound");
    }

    return result;
  }

  async function deleteCategory(id: string) {
    const count = await repo.countChallengesByCategoryId(id);
    if (count > 0) {
      throw new ConflictError("error.cannotDeleteCategory");
    }

    await repo.deleteById(id);
  }

  return {
    createCategory,
    deleteCategory,
    ensureUniqueSlug,
    getActiveCategories,
    getAllCategories,
    getCategoryById,
    updateCategory,
  };
}

export const categoryService = createCategoryService(categoryRepository);
