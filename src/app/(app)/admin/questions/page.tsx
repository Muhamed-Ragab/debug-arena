import type { Metadata } from "next";
import { AdminQuestionsPage } from "@/features/admin/components/AdminQuestionsPage";
import {
  getAdminCategories,
  getAdminChallenges,
} from "@/features/admin/queries";

export const metadata: Metadata = {
  description:
    "AI-powered question and challenge generation studio for Debug Arena administrators.",
  title: "AI Question Studio | Debug Arena Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminQuestionsRoute() {
  const [categories, challenges] = await Promise.all([
    getAdminCategories(),
    getAdminChallenges(),
  ]);

  return <AdminQuestionsPage categories={categories} challenges={challenges} />;
}
