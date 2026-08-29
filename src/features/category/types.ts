import type { z } from "zod";
import type * as schema from "@/db/schema";
import type { createCategorySchema, updateCategorySchema } from "./validation";

export type CreateCategoryInput = z.input<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export interface CategoryDTO {
  color: string | null;
  description: string | null;
  icon: string | null;
  id: string;
  isActive: boolean;
  name: string;
  slug: string;
  sortOrder: number;
}

export type Category = CategoryDTO;

export type CategoryRow = typeof schema.categories.$inferSelect;

export interface CategoryRepository {
  countChallengesByCategoryId: (id: string) => Promise<number>;
  create: (input: CreateCategoryInput) => Promise<CategoryDTO>;
  deleteById: (id: string) => Promise<void>;
  findActive: () => Promise<CategoryDTO[]>;
  findAll: () => Promise<CategoryDTO[]>;
  findById: (id: string) => Promise<CategoryDTO | null>;
  findBySlug: (slug: string) => Promise<CategoryDTO | null>;
  update: (
    id: string,
    input: UpdateCategoryInput["data"]
  ) => Promise<CategoryDTO | null>;
}
