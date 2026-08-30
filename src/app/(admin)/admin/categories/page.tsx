import type { Metadata } from "next";
import { CategoryManagement } from "@/features/category/components/CategoryManagement";
import { categoryService } from "@/features/category/service";

export const metadata: Metadata = {
  description:
    "Manage debug challenge categories — create, edit, and organize.",
  title: "Categories | Debug Arena Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await categoryService.getAllCategories();

  return <CategoryManagement categories={categories} />;
}
