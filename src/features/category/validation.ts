import { z } from "zod";

export const createCategorySchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "validation.invalidHexColor")
    .nullable()
    .optional(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  isActive: z.boolean().default(true),
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "validation.slugFormat")
    .optional(),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
});

export const updateCategorySchema = z.object({
  data: createCategorySchema.partial(),
  id: z.string().uuid(),
});

export const deleteCategorySchema = z.object({
  id: z.string().uuid(),
});

export const createCategoryOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const updateCategoryOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const deleteCategoryOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();
