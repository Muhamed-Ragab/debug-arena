import type { Metadata } from "next";
import { categoryService } from "@/features/category/service";
import { LandingPage } from "@/features/landing/LandingPage";
import { SoftwareApplicationJsonLd } from "@/lib/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  description:
    "Learn debugging by fixing real bugs in live code sandboxes with AI-powered grading, diagnostic radar analytics, and real-world scenarios.",
  path: "/",
  title: "Master Software Debugging",
});

export default async function Home() {
  const categories = await categoryService
    .getActiveCategories()
    .catch((error: unknown) => {
      console.error("[Home] Failed to load categories:", error);
      return [];
    });
  return (
    <>
      <SoftwareApplicationJsonLd />
      <LandingPage categories={categories} />
    </>
  );
}
