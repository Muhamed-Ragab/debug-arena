"use client";

import { useLingui } from "@lingui/react";
import { Bot, FilePlus, FileText, Layers, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  type AdminChallengeItem,
  AdminChallengeList,
} from "./AdminChallengeList";
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
  const { i18n } = useLingui();
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-bold text-2xl text-heading tracking-tight">
              {i18n._("Challenge & Question Studio")}
            </h1>
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-bold text-xs text-primary uppercase">
              {i18n._("Admin")}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {i18n._(
              "Generate with AI or manually author debugging challenges with automated diff calculations, formatted code blocks, and Socratic guidance."
            )}
          </p>
        </div>

        {/* Stats Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <Layers className="text-muted-foreground" size={14} />
            <span className="text-muted-foreground">{i18n._("Total:")}</span>
            <span className="font-bold text-heading">{totalChallenges}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary">
            <Bot size={14} />
            <span>{i18n._("AI Synthesized:")}</span>
            <span className="font-bold">{aiGeneratedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400">
            <span>{i18n._("Published:")}</span>
            <span className="font-bold">{publishedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-400">
            <span>{i18n._("Drafts:")}</span>
            <span className="font-bold">{draftCount}</span>
          </div>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "studio"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:bg-inset hover:text-foreground"
          }`}
          onClick={() => setActiveTab("studio")}
          type="button"
        >
          <Sparkles size={16} />
          {i18n._("AI Question Generator")}
        </button>
        <button
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "manual"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:bg-inset hover:text-foreground"
          }`}
          onClick={() => setActiveTab("manual")}
          type="button"
        >
          <FilePlus size={16} />
          {i18n._("Manual Challenge Authoring")}
        </button>
        <button
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "list"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:bg-inset hover:text-foreground"
          }`}
          onClick={() => setActiveTab("list")}
          type="button"
        >
          <FileText size={16} />
          {i18n._("Challenge Management ({count})", { count: totalChallenges })}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "studio" ? (
        <QuestionGeneratorStudio
          categories={categories}
          onChallengeSaved={handleRefresh}
        />
      ) : activeTab === "manual" ? (
        <ManualChallengeCreator
          categories={categories}
          onChallengeSaved={handleRefresh}
        />
      ) : (
        <AdminChallengeList challenges={challenges} onRefresh={handleRefresh} />
      )}
    </div>
  );
}
