import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { OFFLINE_MESSAGE, toOfflineError } from "@/lib/offline";
import { ConflictError } from "@/lib/safe-action/errors";
import type {
  CategoryDTO,
  CategoryRepository,
  CategoryRow,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./types";

function handleDbError(err: unknown, context: string): never {
  const { code } = err as { code?: string };
  if (code === "23505") {
    throw new ConflictError("Category slug already exists", {
      cause: err as Error,
    });
  }
  if (code === "23503") {
    throw new ConflictError("Category in use — cannot delete or update", {
      cause: err as Error,
    });
  }
  console.warn(`[categoryRepository.${context}] DB error:`, err);
  throw toOfflineError(err, OFFLINE_MESSAGE);
}

function toDTO(row: CategoryRow): CategoryDTO {
  return {
    color: row.color,
    description: row.description,
    icon: row.icon,
    id: row.id,
    isActive: row.isActive,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
  };
}

export function createCategoryRepository(
  dbClient: typeof db = db
): CategoryRepository {
  async function countChallengesByCategoryId(id: string): Promise<number> {
    try {
      const [result] = await dbClient
        .select({ value: count() })
        .from(schema.challenges)
        .where(eq(schema.challenges.categoryId, id));

      return result?.value ?? 0;
    } catch (err) {
      handleDbError(err, "countChallengesByCategoryId");
    }
  }

  async function create(input: CreateCategoryInput): Promise<CategoryDTO> {
    try {
      const [inserted] = await dbClient
        .insert(schema.categories)
        .values(input as typeof schema.categories.$inferInsert)
        .returning();

      return toDTO(inserted);
    } catch (err) {
      handleDbError(err, "create");
    }
  }

  async function deleteById(id: string): Promise<void> {
    try {
      await dbClient
        .delete(schema.categories)
        .where(eq(schema.categories.id, id));
    } catch (err) {
      handleDbError(err, "deleteById");
    }
  }

  async function findActive(): Promise<CategoryDTO[]> {
    try {
      const rows = await dbClient.query.categories.findMany({
        orderBy: [asc(schema.categories.sortOrder)],
        where: eq(schema.categories.isActive, true),
      });

      return rows.map(toDTO);
    } catch (err) {
      handleDbError(err, "findActive");
    }
  }

  async function findAll(): Promise<CategoryDTO[]> {
    try {
      const rows = await dbClient.query.categories.findMany({
        orderBy: [asc(schema.categories.sortOrder)],
      });

      return rows.map(toDTO);
    } catch (err) {
      handleDbError(err, "findAll");
    }
  }

  async function findById(id: string): Promise<CategoryDTO | null> {
    try {
      const row = await dbClient.query.categories.findFirst({
        where: eq(schema.categories.id, id),
      });

      return row ? toDTO(row) : null;
    } catch (err) {
      handleDbError(err, "findById");
    }
  }

  async function findBySlug(slug: string): Promise<CategoryDTO | null> {
    try {
      const row = await dbClient.query.categories.findFirst({
        where: eq(schema.categories.slug, slug),
      });

      return row ? toDTO(row) : null;
    } catch (err) {
      handleDbError(err, "findBySlug");
    }
  }

  async function update(
    id: string,
    input: UpdateCategoryInput["data"]
  ): Promise<CategoryDTO | null> {
    try {
      const [updated] = await dbClient
        .update(schema.categories)
        .set(input as never)
        .where(eq(schema.categories.id, id))
        .returning();

      return updated ? toDTO(updated) : null;
    } catch (err) {
      handleDbError(err, "update");
    }
  }

  return {
    countChallengesByCategoryId,
    create,
    deleteById,
    findActive,
    findAll,
    findById,
    findBySlug,
    update,
  };
}

export const categoryRepository = createCategoryRepository();
