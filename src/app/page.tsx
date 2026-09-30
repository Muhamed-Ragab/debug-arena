import { categoryService } from "@/features/category/service";
import { LandingPage } from "@/features/landing/LandingPage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const categories = await categoryService
    .getActiveCategories()
    .catch((error: unknown) => {
      console.error("[Home] Failed to load categories:", error);
      return [];
    });
  return <LandingPage categories={categories} />;
}
