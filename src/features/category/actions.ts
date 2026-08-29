"use server";

import { revalidatePath } from "next/cache";
import { adminActionClient } from "@/lib/safe-action";
import { categoryService } from "./service";
import {
  createCategoryOutputSchema,
  createCategorySchema,
  deleteCategoryOutputSchema,
  deleteCategorySchema,
  updateCategoryOutputSchema,
  updateCategorySchema,
} from "./validation";

export const createCategoryAction = adminActionClient
  .inputSchema(createCategorySchema)
  .outputSchema(createCategoryOutputSchema)
  .action(async ({ parsedInput }) => {
    const result = await categoryService.createCategory(parsedInput);
    revalidatePath("/admin/categories");
    return { category: result, success: true };
  });

export const updateCategoryAction = adminActionClient
  .inputSchema(updateCategorySchema)
  .outputSchema(updateCategoryOutputSchema)
  .action(async ({ parsedInput }) => {
    const result = await categoryService.updateCategory(
      parsedInput.id,
      parsedInput.data
    );
    revalidatePath("/admin/categories");
    return { category: result, success: true };
  });

export const deleteCategoryAction = adminActionClient
  .inputSchema(deleteCategorySchema)
  .outputSchema(deleteCategoryOutputSchema)
  .action(async ({ parsedInput }) => {
    await categoryService.deleteCategory(parsedInput.id);
    revalidatePath("/admin/categories");
    return { success: true };
  });
