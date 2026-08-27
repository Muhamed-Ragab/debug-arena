"use client";

import { useLingui } from "@lingui/react";
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  Cpu,
  FileCode,
  Flame,
  Lightbulb,
  Loader2,
  Play,
  RotateCcw,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
  TestTube,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  generateQuestionAction,
  refineQuestionAction,
  saveAdminChallengeAction,
} from "../actions";
import { DIFFICULTY_VALUES } from "../constants";
import type { GeneratedChallengeDraft } from "../lib/question-generator-agent";
import type { CategoryOption } from "../types";

interface QuestionGeneratorStudioProps {
  categories: CategoryOption[];
  onChallengeSaved?: () => void;
}

const PROMPT_PRESETS = [
  {
    category: "react-rendering",
    difficulty: "easy" as const,
    label: "Stale Closure in useEffect",
    topic: "Stale closure in WebSocket message listener causing state drops",
  },
  {
    category: "backend-concurrency",
    difficulty: "medium" as const,
    label: "Double-Spending Race Condition",
    topic:
      "Concurrent wallet balance deduction without atomic transaction locks",
  },
  {
    category: "react-rendering",
    difficulty: "hard" as const,
    label: "React 19 Server Action Race",
    topic:
      "Optimistic UI state sync mismatch during interleaved Server Action transitions",
  },
  {
    category: "backend-concurrency",
    difficulty: "hard" as const,
    label: "Distributed Mutex Deadlock",
    topic:
      "Distributed lock acquisition ordering deadlock under high worker contention",
  },
  {
    category: "backend-concurrency",
    difficulty: "medium" as const,
    label: "Memory Leak in SSE Stream",
    topic:
      "Unbounded listener array accumulation in Server-Sent Events connection loop",
  },
];

type StudioTab = "scenario" | "code" | "diff" | "hints" | "analysis" | "tests";

export function QuestionGeneratorStudio({
  categories,
  onChallengeSaved,
}: QuestionGeneratorStudioProps) {
  const { i18n } = useLingui();

  // Generator inputs
  const [topic, setTopic] = useState("");
  const [categorySlug, setCategorySlug] = useState(
    categories[0]?.slug || "react-rendering"
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [language, setLanguage] = useState("typescript");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refineInput, setRefineInput] = useState("");
  const [activeTab, setActiveTab] = useState<StudioTab>("scenario");
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  // Active Draft
  const [draft, setDraft] = useState<GeneratedChallengeDraft | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPublishedId(null);
    try {
      const selectedCat = categories.find((c) => c.slug === categorySlug);
      const res = await generateQuestionAction({
        additionalInstructions: additionalInstructions.trim() || undefined,
        categoryName: selectedCat?.name,
        categorySlug,
        difficulty,
        language,
        topic: topic.trim() || undefined,
      });

      if (res?.data?.draft) {
        setDraft(res.data.draft);
        toast.success(
          i18n._("AI Agent generated challenge draft successfully!")
        );
      } else if (res?.serverError) {
        toast.error(res.serverError);
      }
    } catch (err) {
      console.error(err);
      toast.error(i18n._("Failed to generate challenge."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!(draft && refineInput.trim())) {
      return;
    }
    setIsRefining(true);
    try {
      const res = await refineQuestionAction({
        currentDraft: draft,
        instruction: refineInput.trim(),
      });

      if (res?.data?.draft) {
        setDraft(res.data.draft);
        setRefineInput("");
        toast.success(i18n._("Challenge refined by AI Agent!"));
      } else if (res?.serverError) {
        toast.error(res.serverError);
      }
    } catch (err) {
      console.error(err);
      toast.error(i18n._("Failed to refine challenge draft."));
    } finally {
      setIsRefining(false);
    }
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!draft) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await saveAdminChallengeAction({
        buggyArtifact: draft.buggyArtifact,
        categorySlug: draft.categorySlug,
        difficulty: draft.difficulty,
        format: draft.format,
        hiddenTests: draft.hiddenTests,
        hints: draft.hints,
        preventionNotes: draft.preventionNotes,
        prompt: draft.prompt,
        referenceFix: draft.referenceFix,
        rootCauseSummary: draft.rootCauseSummary,
        source: "ai_generated",
        status,
        title: draft.title,
      });

      if (res?.data?.success && res.data.challengeId) {
        setPublishedId(res.data.challengeId);
        toast.success(
          status === "published"
            ? i18n._("Challenge published live to the arena!")
            : i18n._("Challenge draft saved successfully.")
        );
        onChallengeSaved?.();
      } else if (res?.serverError) {
        toast.error(res.serverError);
      }
    } catch (err) {
      console.error(err);
      toast.error(i18n._("Failed to save challenge."));
    } finally {
      setIsSaving(false);
    }
  };

  const currentBuggyFile =
    draft?.buggyArtifact.files[selectedFileIdx] ||
    draft?.buggyArtifact.files[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Generator Configuration Card */}
      <div className="rounded-xl border border-border/80 bg-surface/70 p-6 shadow-sm backdrop-blur-md">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-heading text-lg">
                {i18n._("AI Challenge Synthesis Agent")}
              </h2>
              <p className="text-muted-foreground text-xs">
                {i18n._(
                  "Synthesize high-fidelity debugging scenarios, buggy multi-file code, reference fixes, and progressive hints."
                )}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 sm:mt-0">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 font-medium text-[11px] text-primary">
              <Cpu size={13} />
              {i18n._("Llama 3.3 70B & Vector Embedder")}
            </span>
          </div>
        </div>

        {/* Preset Prompt Chips */}
        <div className="mb-4">
          <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {i18n._("Scenario Presets")}
          </p>
          <div className="flex flex-wrap gap-2">
            {PROMPT_PRESETS.map((preset) => (
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-foreground/80 text-xs transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                key={preset.label}
                onClick={() => {
                  setTopic(preset.topic);
                  setCategorySlug(preset.category);
                  setDifficulty(preset.difficulty);
                }}
                type="button"
              >
                <Flame className="text-amber-500" size={12} />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label
              className="mb-1.5 block font-medium text-heading text-xs"
              htmlFor="topic-input"
            >
              {i18n._("Scenario / Bug Topic Idea")}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-inset px-3.5 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              id="topic-input"
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Stale closure in WebSocket event listener causing state drops"
              type="text"
              value={topic}
            />
          </div>

          <div className="md:col-span-3">
            <label
              className="mb-1.5 block font-medium text-heading text-xs"
              htmlFor="category-select"
            >
              {i18n._("Category")}
            </label>
            <select
              className="w-full rounded-lg border border-border bg-inset px-3 py-2.5 text-foreground text-sm focus:border-primary focus:outline-none"
              id="category-select"
              onChange={(e) => setCategorySlug(e.target.value)}
              value={categorySlug}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <span className="mb-1.5 block font-medium text-heading text-xs">
              {i18n._("Difficulty")}
            </span>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-inset p-1">
              {DIFFICULTY_VALUES.map((d) => (
                <button
                  className={`rounded py-1.5 font-semibold text-xs uppercase tracking-wider transition-colors ${
                    difficulty === d
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  key={d}
                  onClick={() => setDifficulty(d)}
                  type="button"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <label
              className="mb-1.5 block font-medium text-heading text-xs"
              htmlFor="qgs-language"
            >
              {i18n._("Language")}
            </label>
            <select
              className="w-full rounded-lg border border-border bg-inset px-3 py-2.5 text-foreground text-sm focus:border-primary focus:outline-none"
              id="qgs-language"
              onChange={(e) => setLanguage(e.target.value)}
              value={language}
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="sql">SQL / Postgres</option>
              <option value="go">Go</option>
            </select>
          </div>

          <div className="md:col-span-9">
            <label
              className="mb-1.5 block font-medium text-heading text-xs"
              htmlFor="qgs-instructions"
            >
              {i18n._("Custom Instructions (Optional)")}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-inset px-3.5 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              id="qgs-instructions"
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="e.g. Include two helper files, focus on async race condition under high throughput..."
              type="text"
              value={additionalInstructions}
            />
          </div>
        </div>

        {/* Generate Trigger */}
        <div className="mt-5 flex items-center justify-end">
          <Button
            className="flex items-center gap-2 px-6"
            disabled={isGenerating}
            onClick={handleGenerate}
            size="md"
            variant="default"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>{i18n._("Synthesizing Challenge with AI...")}</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{i18n._("Synthesize Challenge Draft")}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Generated Challenge Inspector & Live Editor */}
      {Boolean(draft) && (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface/90 p-6 shadow-md backdrop-blur-md">
          {/* Challenge Top Bar */}
          <div className="flex flex-col gap-3 border-border border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2.5 py-0.5 font-bold text-primary text-xs uppercase">
                  {draft?.difficulty}
                </span>
                <span className="rounded bg-inset px-2.5 py-0.5 font-mono text-muted-foreground text-xs">
                  {draft?.buggyArtifact.points} pts
                </span>
                <span className="rounded bg-inset px-2.5 py-0.5 font-mono text-muted-foreground text-xs">
                  ⏱ {draft?.buggyArtifact.timeLimit}
                </span>
              </div>
              <input
                className="w-full border-transparent border-b bg-transparent py-0.5 font-bold text-heading text-xl hover:border-border focus:border-primary focus:outline-none"
                onChange={(e) =>
                  draft && setDraft({ ...draft, title: e.target.value })
                }
                type="text"
                value={draft?.title}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={isSaving}
                onClick={() => handleSave("draft")}
                size="sm"
                variant="outline"
              >
                <Save size={14} />
                {i18n._("Save as Draft")}
              </Button>
              <Button
                disabled={isSaving}
                onClick={() => handleSave("published")}
                size="sm"
                variant="default"
              >
                <Play size={14} />
                {i18n._("Publish to Arena")}
              </Button>
            </div>
          </div>

          {/* Success Banner if published */}
          {Boolean(publishedId) && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-400 text-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} />
                <span>
                  {i18n._("Challenge is saved and ready in the database!")}
                </span>
              </div>
              <Link
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1 font-semibold text-black text-xs transition-colors hover:bg-emerald-400"
                href={`/challenges/${publishedId}`}
                target="_blank"
              >
                {i18n._("Play in Arena")} →
              </Link>
            </div>
          )}

          {/* Inspector Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-border border-b pb-2">
            {[
              {
                icon: Code2,
                id: "scenario" as const,
                label: i18n._("Scenario Prompt"),
              },
              {
                icon: FileCode,
                id: "code" as const,
                label: i18n._("Buggy Code"),
              },
              {
                icon: RotateCcw,
                id: "diff" as const,
                label: i18n._("Reference Fix & Diff"),
              },
              {
                icon: Lightbulb,
                id: "hints" as const,
                label: i18n._("Socratic Hints"),
              },
              {
                icon: ShieldAlert,
                id: "analysis" as const,
                label: i18n._("Root Cause & Prevention"),
              },
              {
                icon: TestTube,
                id: "tests" as const,
                label: i18n._("Verification Tests"),
              },
            ].map(({ id, icon: Icon, label }) => (
              <button
                className={`flex items-center gap-2 rounded-md px-3.5 py-2 font-semibold text-xs transition-all ${
                  activeTab === id
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:bg-inset hover:text-foreground"
                }`}
                key={id}
                onClick={() => setActiveTab(id)}
                type="button"
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab 1: Scenario */}
          {activeTab === "scenario" && (
            <div className="flex flex-col gap-3">
              <label
                className="font-semibold text-heading text-xs uppercase tracking-wider"
                htmlFor="qgs-scenario"
              >
                {i18n._("Scenario Markdown Description")}
              </label>
              <textarea
                className="h-64 w-full rounded-lg border border-border bg-inset p-3.5 font-mono text-foreground text-sm focus:border-primary focus:outline-none"
                id="qgs-scenario"
                onChange={(e) =>
                  draft && setDraft({ ...draft, prompt: e.target.value })
                }
                value={draft?.prompt}
              />
            </div>
          )}

          {/* Tab 2: Buggy Code Multi-File Inspector */}
          {activeTab === "code" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                {/* File Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {draft?.buggyArtifact.files.map((file, idx) => (
                    <button
                      className={`flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-1.5 font-mono text-xs transition-colors ${
                        selectedFileIdx === idx
                          ? "border-primary bg-inset font-bold text-heading"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                      key={file.name}
                      onClick={() => setSelectedFileIdx(idx)}
                      type="button"
                    >
                      <FileCode size={13} />
                      {file.name}
                      {Boolean(file.isEntry) && (
                        <span className="rounded bg-primary/20 px-1 text-[10px] text-primary">
                          entry
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 font-mono text-amber-500 text-xs">
                  <AlertCircle size={14} />
                  <span>
                    Buggy Lines: {draft?.buggyArtifact.buggyLines[0]} -{" "}
                    {draft?.buggyArtifact.buggyLines[1]}
                  </span>
                </div>
              </div>

              {/* Code viewer with line numbers */}
              <div className="overflow-x-auto rounded-lg border border-border bg-black/80 p-4 font-mono text-slate-200 text-xs">
                <pre className="grid grid-cols-[3rem_1fr] gap-4">
                  <div className="select-none text-right text-slate-600">
                    {currentBuggyFile?.code.split("\n").map((line, i) => (
                      <div
                        className={
                          draft &&
                          i + 1 >= draft.buggyArtifact.buggyLines[0] &&
                          i + 1 <= draft.buggyArtifact.buggyLines[1]
                            ? "font-bold text-amber-400"
                            : ""
                        }
                        key={line}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <div>
                    {currentBuggyFile?.code.split("\n").map((line, i) => (
                      <div
                        className={
                          draft &&
                          i + 1 >= draft.buggyArtifact.buggyLines[0] &&
                          i + 1 <= draft.buggyArtifact.buggyLines[1]
                            ? "rounded bg-amber-500/15 px-1 text-amber-200"
                            : ""
                        }
                        key={line}
                      >
                        {line || " "}
                      </div>
                    ))}
                  </div>
                </pre>
              </div>
            </div>
          )}

          {/* Tab 3: Reference Fix & Diff */}
          {activeTab === "diff" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border/80 bg-inset p-3 text-muted-foreground text-xs">
                <strong className="font-semibold text-heading">
                  {i18n._("Fix Explanation:")}{" "}
                </strong>
                {draft?.referenceFix.explanation}
              </div>

              {/* Diff Viewer */}
              <div className="overflow-x-auto rounded-lg border border-border bg-black/80 p-4 font-mono text-xs">
                {draft?.referenceFix.diff.map((item) => {
                  let bg = "text-slate-300";
                  let prefix = " ";
                  if (item.type === "add") {
                    bg = "bg-emerald-950/60 text-emerald-300";
                    prefix = "+";
                  } else if (item.type === "del") {
                    bg = "bg-rose-950/60 text-rose-300";
                    prefix = "-";
                  }
                  return (
                    <div
                      className={`flex gap-3 rounded px-2 py-0.5 ${bg}`}
                      key={`diff-${item.line}`}
                    >
                      <span className="w-6 select-none text-slate-600">
                        {item.line || " "}
                      </span>
                      <span className="select-none font-bold">{prefix}</span>
                      <span className="whitespace-pre">{item.text || " "}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: Progressive Hints */}
          {activeTab === "hints" && (
            <div className="flex flex-col gap-3">
              {draft?.hints.map((hint, idx) => (
                <div
                  className="rounded-lg border border-border bg-inset p-4"
                  key={`hint-${hint.order}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-heading text-xs">
                      {i18n._("Hint {order}", { order: hint.order })}
                    </span>
                    <span className="rounded bg-rose-500/10 px-2 py-0.5 font-mono text-rose-400 text-xs">
                      -{hint.penaltyPoints} pts
                    </span>
                  </div>
                  <textarea
                    className="w-full rounded border border-border bg-surface p-2.5 text-foreground text-xs focus:border-primary focus:outline-none"
                    onChange={(e) => {
                      if (!draft) {
                        return;
                      }
                      const nextHints = [...draft.hints];
                      nextHints[idx] = {
                        ...hint,
                        socraticPrompt: e.target.value,
                      };
                      setDraft({ ...draft, hints: nextHints });
                    }}
                    rows={2}
                    value={hint.socraticPrompt}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Root Cause & Prevention Notes */}
          {activeTab === "analysis" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  className="font-semibold text-heading text-xs uppercase tracking-wider"
                  htmlFor="qgs-rootcause"
                >
                  {i18n._("Canonical Root Cause Breakdown")}
                </label>
                <textarea
                  className="h-48 w-full rounded-lg border border-border bg-inset p-3 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
                  id="qgs-rootcause"
                  onChange={(e) =>
                    draft &&
                    setDraft({ ...draft, rootCauseSummary: e.target.value })
                  }
                  value={draft?.rootCauseSummary}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className="font-semibold text-heading text-xs uppercase tracking-wider"
                  htmlFor="qgs-prevention"
                >
                  {i18n._("Prevention Notes & Safeguards")}
                </label>
                <textarea
                  className="h-48 w-full rounded-lg border border-border bg-inset p-3 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
                  id="qgs-prevention"
                  onChange={(e) =>
                    draft &&
                    setDraft({ ...draft, preventionNotes: e.target.value })
                  }
                  value={draft?.preventionNotes}
                />
              </div>
            </div>
          )}

          {/* Tab 6: Verification Tests */}
          {activeTab === "tests" && (
            <div className="flex flex-col gap-3">
              {draft?.hiddenTests && draft.hiddenTests.length > 0 ? (
                draft.hiddenTests.map((t) => (
                  <div
                    className="rounded-lg border border-border bg-inset p-4"
                    key={`test-${t.name}`}
                  >
                    <div className="mb-1 font-semibold text-heading text-xs">
                      {t.name}
                    </div>
                    <div className="mb-2 text-muted-foreground text-xs">
                      {t.description}
                    </div>
                    <pre className="rounded border border-border/80 bg-black/70 p-3 font-mono text-emerald-300 text-xs">
                      {t.testCode}
                    </pre>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-border bg-inset p-6 text-center text-muted-foreground text-xs">
                  {i18n._(
                    "No specific automated test scripts defined for this challenge."
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Refinement Bar */}
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold text-primary text-xs">
              <Sparkles size={14} />
              <span>{i18n._("AI Agent Refinement Chat")}</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="flex-1 rounded-lg border border-border bg-surface px-3.5 py-2 text-foreground text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                disabled={isRefining}
                onChange={(e) => setRefineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRefine();
                  }
                }}
                placeholder="e.g. Make the bug harder by adding an async timing hazard, or rewrite hints to be more subtle..."
                type="text"
                value={refineInput}
              />
              <Button
                disabled={isRefining || !refineInput.trim()}
                onClick={handleRefine}
                size="sm"
                variant="default"
              >
                {isRefining ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Send size={14} />
                )}
                <span>{i18n._("Refine Draft")}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
