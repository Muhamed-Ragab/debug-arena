"use client";

import { Bot, FilePlus, FileText, Layers, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminChallengeItem } from "../types";
import { AdminChallengeList } from "./AdminChallengeList";
import { ManualChallengeCreator } from "./ManualChallengeCreator";
import { QuestionGeneratorStudio } from "./QuestionGeneratorStudio";

interface CategoryItem {
  description: string | null;
  id: string;
  name: string;
  slug: string;
}

interface AdminQuestionsPageProps {
  categories: CategoryItem[];
  challenges: AdminChallengeItem[];
}

export function AdminQuestionsPage({
  categories,
  challenges,
}: AdminQuestionsPageProps) {
  const t = useExtracted();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"studio" | "manual" | "list">(
    "studio"
  );

  const totalChallenges = challenges.length;
  const aiGeneratedCount = challenges.filter(
    (c) => c.source === "ai_generated"
  ).length;
  const publishedCount = challenges.filter(
    (c) => c.status === "published"
  ).length;
  const draftCount = challenges.filter((c) => c.status === "draft").length;

  const handleRefresh = () => {
    router.refresh();
  };

  const renderTab = () => {
    if (activeTab === "studio") {
      return (
        <QuestionGeneratorStudio
          categories={categories}
          onChallengeSaved={handleRefresh}
        />
      );
    }
    if (activeTab === "manual") {
      return (
        <ManualChallengeCreator
          categories={categories}
          onChallengeSaved={handleRefresh}
        />
      );
    }
    return (
      <AdminChallengeList challenges={challenges} onRefresh={handleRefresh} />
    );
  };

  return (
    <div className="flex flex-col">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-bold text-2xl text-heading tracking-tight">
                {t("Challenge & Question Studio")}
              </h1>
              <Badge className="font-bold text-xs uppercase" variant="default">
                {t("Admin")}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {t(
                "Generate with AI or manually author debugging challenges with automated diff calculations, formatted code blocks, and Socratic guidance."
              )}
            </p>
          </div>

          {/* Stats Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1.5 px-3 py-1.5 text-xs" variant="outline">
              <Layers className="text-muted-foreground" size={14} />
              <span className="text-muted-foreground">{t("Total:")}</span>
              <span className="font-bold text-heading">{totalChallenges}</span>
            </Badge>
            <Badge className="gap-1.5 px-3 py-1.5 text-xs" variant="default">
              <Bot size={14} />
              <span>{t("AI Synthesized:")}</span>
              <span className="font-bold">{aiGeneratedCount}</span>
            </Badge>
            <Badge className="gap-1.5 px-3 py-1.5 text-xs" variant="success">
              <span>{t("Published:")}</span>
              <span className="font-bold">{publishedCount}</span>
            </Badge>
            <Badge className="gap-1.5 px-3 py-1.5 text-xs" variant="warning">
              <span>{t("Drafts:")}</span>
              <span className="font-bold">{draftCount}</span>
            </Badge>
          </div>
        </div>

        {/* Main Mode Tabs */}
        <div className="flex items-center gap-2 border-border border-b pb-2">
          <Button
            className="gap-2"
            onClick={() => setActiveTab("studio")}
            size="md"
            variant={activeTab === "studio" ? "default" : "ghost"}
          >
            <Sparkles size={16} />
            {t("AI Question Generator")}
          </Button>
          <Button
            className="gap-2"
            onClick={() => setActiveTab("manual")}
            size="md"
            variant={activeTab === "manual" ? "default" : "ghost"}
          >
            <FilePlus size={16} />
            {t("Manual Challenge Authoring")}
          </Button>
          <Button
            className="gap-2"
            onClick={() => setActiveTab("list")}
            size="md"
            variant={activeTab === "list" ? "default" : "ghost"}
          >
            <FileText size={16} />
            {t("Challenge Management ({count})", {
              count: String(totalChallenges),
            })}
          </Button>
        </div>

        {/* Tab Panels */}
        {renderTab()}
      </div>
    </div>
  );
}
