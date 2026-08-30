"use client";

import {
  CheckCircle2,
  FileCode,
  FilePlus,
  Lightbulb,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { FormattedMarkdown } from "@/components/shared/FormattedMarkdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIFFICULTY_LABEL } from "@/features/challenge/constants";
import { flattenValidationErrors } from "@/lib/safe-action/validation";
import { saveAdminChallengeAction } from "../actions";
import { DIFFICULTY_VALUES } from "../constants";
import {
  computeUnifiedDiff,
  detectBuggyLines,
} from "../lib/question-generator-agent";
import type {
  CategoryOption,
  ChallengeFile,
  ChallengeHiddenTest,
  ChallengeHint,
  DiffLine,
} from "../types";

interface ManualChallengeCreatorProps {
  categories: CategoryOption[];
  onChallengeSaved?: () => void;
}

export function ManualChallengeCreator({
  categories,
  onChallengeSaved,
}: ManualChallengeCreatorProps) {
  const t = useExtracted();
  // Basic Info
  const [title, setTitle] = useState("");
  const [categorySlug, setCategorySlug] = useState(
    categories[0]?.slug || "react-rendering"
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [format, setFormat] = useState<
    "code_snippet" | "log_only" | "ui_recording"
  >("code_snippet");
  const [language, setLanguage] = useState("typescript");
  const [points, setPoints] = useState(200);
  const [timeLimit, setTimeLimit] = useState("20 min");

  // Prompt / Scenario
  const [prompt, setPrompt] = useState(
    "## Scenario: Unexpected State Glitch\n\nDescribe the debugging scenario here.\n\n### Task\n1. Locate the bug.\n2. Fix the implementation."
  );
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  // Buggy Files
  const [buggyFiles, setBuggyFiles] = useState<ChallengeFile[]>([
    {
      code: "export function App() {\n  // Insert buggy code here\n  return <div>Debug Arena</div>;\n}",
      isEntry: true,
      name: "App.tsx",
    },
  ]);
  const [buggyLines, setBuggyLines] = useState<[number, number]>([2, 2]);

  // Fixed Files & Diff
  const [fixedFiles, setFixedFiles] = useState<ChallengeFile[]>([
    {
      code: "export function App() {\n  // Insert fixed code here\n  return <div>Debug Arena</div>;\n}",
      isEntry: true,
      name: "App.tsx",
    },
  ]);
  const [fixExplanation, setFixExplanation] = useState("Fixed root cause.");
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);

  // Hints
  const [hints, setHints] = useState<ChallengeHint[]>([
    {
      order: 1,
      penaltyPoints: 10,
      socraticPrompt:
        "Look closely at the lifecycle and state synchronization.",
    },
    {
      order: 2,
      penaltyPoints: 20,
      socraticPrompt: "Check if closures capture stale variable references.",
    },
    {
      order: 3,
      penaltyPoints: 30,
      socraticPrompt:
        "Use functional updates or dependency arrays to ensure fresh values.",
    },
  ]);

  // Root Cause & Prevention
  const [rootCauseSummary, setRootCauseSummary] = useState(
    "Detailed explanation of why the bug occurred at runtime."
  );
  const [preventionNotes, setPreventionNotes] = useState(
    "Best practices, linting rules, and tests to prevent regressions."
  );

  // Tests
  const [hiddenTests, _setHiddenTests] = useState<ChallengeHiddenTest[]>([
    {
      description: "Verify state synchronization under sequential updates",
      name: "Handles sequential transitions correctly",
      testCode: "expect(result).toBe(true);",
    },
  ]);

  // States
  const [isSaving, setIsSaving] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleDifficultyChange = (d: "easy" | "medium" | "hard") => {
    setDifficulty(d);
    if (d === "easy") {
      setPoints(100);
      setTimeLimit("15 min");
    } else if (d === "medium") {
      setPoints(200);
      setTimeLimit("20 min");
    } else {
      setPoints(300);
      setTimeLimit("30 min");
    }
  };

  // Add new file
  const handleAddFile = () => {
    const newFileName = `helper-${buggyFiles.length + 1}.ts`;
    setBuggyFiles((prev) => [
      ...prev,
      { code: "// Helper module code", isEntry: false, name: newFileName },
    ]);
    setFixedFiles((prev) => [
      ...prev,
      { code: "// Helper module code", name: newFileName },
    ]);
  };

  // Remove file
  const handleRemoveFile = (index: number) => {
    if (buggyFiles.length <= 1) {
      toast.error(t("Challenge must have at least one file."));
      return;
    }
    setBuggyFiles((prev) => prev.filter((_, i) => i !== index));
    setFixedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto calculate diff & lines
  const handleAutoComputeDiff = () => {
    const entryBuggy = buggyFiles.find((f) => f.isEntry) || buggyFiles[0];
    const entryFixed =
      fixedFiles.find((f) => f.name === entryBuggy?.name) || fixedFiles[0];

    if (entryBuggy && entryFixed) {
      const computed = computeUnifiedDiff(entryBuggy.code, entryFixed.code);
      setDiffLines(computed);
      const lines = detectBuggyLines(entryBuggy.code, entryFixed.code);
      setBuggyLines(lines);
      toast.success(
        t("Auto-calculated diff and detected buggy lines: [{start}, {end}]", {
          end: String(lines[1]),
          start: String(lines[0]),
        })
      );
    }
  };

  const validateChallenge = (): string | null => {
    if (!title.trim()) {
      return t("Challenge title is required.");
    }
    if (!prompt.trim()) {
      return t("Scenario prompt is required.");
    }
    if (!rootCauseSummary.trim()) {
      return t("Root cause summary is required.");
    }
    return null;
  };

  const handleSave = async (status: "draft" | "published") => {
    const validationError = validateChallenge();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    setServerError(null);
    setFieldErrors({});
    try {
      const entryBuggy = buggyFiles.find((f) => f.isEntry) || buggyFiles[0];
      const entryFixed =
        fixedFiles.find((f) => f.name === entryBuggy?.name) || fixedFiles[0];
      let computedDiff: DiffLine[] = [];
      if (diffLines.length > 0) {
        computedDiff = diffLines;
      } else if (entryBuggy && entryFixed) {
        computedDiff = computeUnifiedDiff(entryBuggy.code, entryFixed.code);
      }

      const res = await saveAdminChallengeAction({
        buggyArtifact: {
          buggyLines,
          entryFile: entryBuggy.name,
          files: buggyFiles,
          language,
          points,
          timeLimit,
        },
        categorySlug,
        difficulty,
        format,
        hiddenTests,
        hints,
        preventionNotes,
        prompt,
        referenceFix: {
          diff: computedDiff,
          explanation: fixExplanation,
          files: fixedFiles,
        },
        rootCauseSummary,
        source: "manual",
        status,
        title,
      });

      if (res?.data?.success && res.data.challengeId) {
        setPublishedId(res.data.challengeId);
        setServerError(null);
        toast.success(
          status === "published"
            ? t("Challenge published live to the arena!")
            : t("Challenge draft saved successfully.")
        );
        onChallengeSaved?.();
      } else if (res?.validationErrors) {
        const flat = flattenValidationErrors(res.validationErrors);
        setFieldErrors(flat);
        const first =
          flat.title ??
          flat.prompt ??
          flat.rootCauseSummary ??
          flat.categorySlug ??
          flat.difficulty ??
          flat._errors ??
          "Validation failed";
        setServerError(first);
        toast.error(t("Validation failed"));
      } else if (res?.serverError) {
        setServerError(res.serverError);
        toast.error(res.serverError);
        // map known Conflict/NotFound to fieldErrors where applicable
        const lower = res.serverError.toLowerCase();
        if (lower.includes("category") && lower.includes("slug")) {
          setFieldErrors((prev) => ({
            ...prev,
            categorySlug: res.serverError as string,
          }));
        }
        if (lower.includes("title")) {
          setFieldErrors((prev) => ({
            ...prev,
            title: res.serverError as string,
          }));
        }
      } else {
        setServerError(t("Something went wrong"));
        toast.error(t("Something went wrong"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to save challenge."));
      setServerError(t("Something went wrong"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Form Container */}
      <div className="flex flex-col gap-6 rounded-xl border border-border bg-surface/80 p-6 shadow-md backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col gap-3 border-border border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FilePlus size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-heading text-lg">
                {t("Manual Challenge Authoring Studio")}
              </h2>
              <p className="text-muted-foreground text-xs">
                {t(
                  "Create and configure debugging scenarios with custom multi-file code, test cases, and Socratic hints."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              disabled={isSaving}
              onClick={() => handleSave("draft")}
              size="sm"
              variant="outline"
            >
              <Save size={14} />
              {t("Save Draft")}
            </Button>
            <Button
              disabled={isSaving}
              onClick={() => handleSave("published")}
              size="sm"
              variant="default"
            >
              <Play size={14} />
              {t("Publish to Arena")}
            </Button>
          </div>
        </div>

        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        {/* Success Banner if published */}
        {Boolean(publishedId) && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-400 text-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} />
              <span>{t("Challenge created and published successfully!")}</span>
            </div>
            <Link
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1 font-semibold text-black text-xs transition-colors hover:bg-emerald-400"
              href={`/challenges/${publishedId}`}
              target="_blank"
            >
              {t("Play in Arena")} →
            </Link>
          </div>
        )}

        {/* 1. Core Metadata */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label
              className="mb-1.5 block font-semibold text-heading text-xs"
              htmlFor="challenge-title"
            >
              {t("Challenge Title *")}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-inset px-3.5 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              id="challenge-title"
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((prev) => {
                    const { title: _omit, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              placeholder="e.g. Race Condition in Distributed Cache Store"
              type="text"
              value={title}
            />
            {Boolean(fieldErrors.title) && (
              <p className="mt-1 text-destructive text-xs">
                {fieldErrors.title}
              </p>
            )}
          </div>

          <div className="md:col-span-3">
            <label
              className="mb-1.5 block font-semibold text-heading text-xs"
              htmlFor="challenge-category"
            >
              {t("Category *")}
            </label>
            <Select
              onValueChange={(val) => {
                setCategorySlug(val ?? "");
                if (fieldErrors.categorySlug) {
                  setFieldErrors((prev) => {
                    const { categorySlug: _omit, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              value={categorySlug}
            >
              <SelectTrigger
                className="w-full rounded-lg border-border bg-inset px-3 py-2 text-foreground text-xs"
                id="challenge-category"
              >
                <SelectValue placeholder={t("Select category...")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {Boolean(fieldErrors.categorySlug) && (
              <p className="mt-1 text-destructive text-xs">
                {fieldErrors.categorySlug}
              </p>
            )}
          </div>

          <div className="md:col-span-3">
            <label
              className="mb-1.5 block font-semibold text-heading text-xs"
              htmlFor="difficulty-select"
            >
              {t("Difficulty *")}
            </label>
            <Select
              onValueChange={(v) => {
                handleDifficultyChange(v as "easy" | "medium" | "hard");
                if (fieldErrors.difficulty) {
                  setFieldErrors((prev) => {
                    const { difficulty: _omit, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              value={difficulty}
            >
              <SelectTrigger
                className="w-full rounded-lg border-border bg-inset px-3 py-2 text-foreground text-xs"
                id="difficulty-select"
              >
                <SelectValue placeholder={t("Select difficulty...")} />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_VALUES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {DIFFICULTY_LABEL[d] ?? d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {Boolean(fieldErrors.difficulty) && (
              <p
                className="mt-1.5 text-destructive text-xs"
                id="difficulty-error"
              >
                {fieldErrors.difficulty}
              </p>
            )}
          </div>

          <div className="md:col-span-3">
            <label
              className="mb-1.5 block font-semibold text-heading text-xs"
              htmlFor="challenge-language"
            >
              {t("Language")}
            </label>
            <Select
              onValueChange={(val) => setLanguage(val ?? "typescript")}
              value={language}
            >
              <SelectTrigger
                className="w-full rounded-lg border-border bg-inset px-3 py-2 text-foreground text-xs"
                id="challenge-language"
              >
                <SelectValue placeholder="TypeScript" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="sql">SQL / Postgres</SelectItem>
                <SelectItem value="go">Go</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <label
              className="mb-1.5 block font-semibold text-heading text-xs"
              htmlFor="challenge-format"
            >
              {t("Format")}
            </label>
            <Select
              onValueChange={(val) => {
                if (val) {
                  setFormat(
                    val as "code_snippet" | "log_only" | "ui_recording"
                  );
                }
              }}
              value={format}
            >
              <SelectTrigger
                className="w-full rounded-lg border-border bg-inset px-3 py-2 text-foreground text-xs"
                id="challenge-format"
              >
                <SelectValue placeholder={t("Code Snippet / Multi-file")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code_snippet">
                  {t("Code Snippet / Multi-file")}
                </SelectItem>
                <SelectItem value="log_only">{t("Log Trace Only")}</SelectItem>
                <SelectItem value="ui_recording">
                  {t("UI Recording")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <label
              className="mb-1.5 block font-semibold text-heading text-xs"
              htmlFor="challenge-points"
            >
              {t("Points")}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-inset px-3.5 py-2 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
              id="challenge-points"
              onChange={(e) => setPoints(Number(e.target.value))}
              type="number"
              value={points}
            />
          </div>

          <div className="md:col-span-3">
            <label
              className="mb-1.5 block font-semibold text-heading text-xs"
              htmlFor="challenge-time-limit"
            >
              {t("Time Limit")}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-inset px-3.5 py-2 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
              id="challenge-time-limit"
              onChange={(e) => setTimeLimit(e.target.value)}
              type="text"
              value={timeLimit}
            />
          </div>
        </div>

        {/* 2. Scenario Prompt */}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-inset/40 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-heading text-xs uppercase tracking-wider">
              {t("Scenario Markdown Description *")}
            </span>
            <Button
              className="h-auto p-0 font-semibold text-primary text-xs hover:underline"
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              size="sm"
              type="button"
              variant="link"
            >
              {showPromptPreview
                ? t("Edit Raw Markdown")
                : t("Preview Formatted Markdown")}
            </Button>
          </div>

          {showPromptPreview ? (
            <div className="min-h-48 rounded-lg border border-border bg-card p-4">
              <FormattedMarkdown content={prompt} />
            </div>
          ) : (
            <>
              <textarea
                className="h-48 w-full rounded-lg border border-border bg-surface p-3 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (fieldErrors.prompt) {
                    setFieldErrors((prev) => {
                      const { prompt: _omit, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                rows={8}
                value={prompt}
              />
              {Boolean(fieldErrors.prompt) && (
                <p className="text-destructive text-xs">{fieldErrors.prompt}</p>
              )}
            </>
          )}
        </div>

        {/* 3. Buggy Files & Reference Fixes */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="text-primary" size={16} />
              <h3 className="font-semibold text-heading text-sm">
                {t("Challenge Files & Bug Injection")}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAutoComputeDiff}
                size="sm"
                variant="outline"
              >
                <RotateCcw size={13} />
                {t("Auto-Compute Diff & Lines")}
              </Button>
              <Button onClick={handleAddFile} size="sm" variant="outline">
                <Plus size={13} />
                {t("Add File")}
              </Button>
            </div>
          </div>

          {/* Files Grid */}
          {buggyFiles.map((file, idx) => (
            <div
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
              key={file.name}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    className="rounded border border-border bg-inset px-2.5 py-1 font-mono font-semibold text-heading text-xs focus:border-primary focus:outline-none"
                    onChange={(e) => {
                      const name = e.target.value;
                      setBuggyFiles((prev) =>
                        prev.map((f, i) => (i === idx ? { ...f, name } : f))
                      );
                      setFixedFiles((prev) =>
                        prev.map((f, i) => (i === idx ? { ...f, name } : f))
                      );
                    }}
                    type="text"
                    value={file.name}
                  />
                  <label className="flex cursor-pointer items-center gap-1.5 text-muted-foreground text-xs">
                    <input
                      checked={Boolean(file.isEntry)}
                      name="isEntryRadio"
                      onChange={() =>
                        setBuggyFiles((prev) =>
                          prev.map((f, i) => ({ ...f, isEntry: i === idx }))
                        )
                      }
                      type="radio"
                    />
                    <span>{t("Entry File")}</span>
                  </label>
                </div>

                {buggyFiles.length > 1 && (
                  <Button
                    className="text-rose-400 hover:text-rose-300"
                    onClick={() => handleRemoveFile(idx)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>

              {/* Buggy Code vs Fixed Code Comparison */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono font-semibold text-[11px] text-amber-400">
                    {t("Buggy Code ({name})", { name: String(file.name) })}
                  </span>
                  <textarea
                    className="h-52 w-full rounded border border-border bg-black/80 p-3 font-mono text-amber-100 text-xs focus:border-primary focus:outline-none"
                    onChange={(e) => {
                      const code = e.target.value;
                      setBuggyFiles((prev) =>
                        prev.map((f, i) => (i === idx ? { ...f, code } : f))
                      );
                    }}
                    value={file.code}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-mono font-semibold text-[11px] text-emerald-400">
                    {t("Fixed Reference Code ({name})", {
                      name: String(file.name),
                    })}
                  </span>
                  <textarea
                    className="h-52 w-full rounded border border-border bg-black/80 p-3 font-mono text-emerald-100 text-xs focus:border-primary focus:outline-none"
                    onChange={(e) => {
                      const code = e.target.value;
                      setFixedFiles((prev) =>
                        prev.map((f, i) => (i === idx ? { ...f, code } : f))
                      );
                    }}
                    value={fixedFiles[idx]?.code || ""}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Buggy line range config */}
          <div className="flex items-center gap-4 rounded-lg border border-border bg-inset/50 p-3 text-xs">
            <span className="font-semibold text-heading">
              {t("Buggy Lines Location (1-Indexed):")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("Start:")}</span>
              <input
                className="w-16 rounded border border-border bg-surface px-2 py-1 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
                onChange={(e) =>
                  setBuggyLines([Number(e.target.value), buggyLines[1]])
                }
                type="number"
                value={buggyLines[0]}
              />
              <span className="text-muted-foreground">{t("End:")}</span>
              <input
                className="w-16 rounded border border-border bg-surface px-2 py-1 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
                onChange={(e) =>
                  setBuggyLines([buggyLines[0], Number(e.target.value)])
                }
                type="number"
                value={buggyLines[1]}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {t(
                "(Players get graded on whether their selected lines overlap this range)"
              )}
            </span>
          </div>

          {/* Fix Explanation */}
          <div className="flex flex-col gap-1.5">
            <label
              className="font-semibold text-heading text-xs"
              htmlFor="challenge-fix-explanation"
            >
              {t("Reference Fix Explanation")}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-inset px-3 py-2 text-foreground text-xs focus:border-primary focus:outline-none"
              id="challenge-fix-explanation"
              onChange={(e) => setFixExplanation(e.target.value)}
              placeholder="e.g. Wrapped balance decrement and update in an atomic transaction..."
              type="text"
              value={fixExplanation}
            />
          </div>
        </div>

        {/* 4. Socratic Hints */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="text-amber-400" size={16} />
            <h3 className="font-semibold text-heading text-sm">
              {t("Progressive Socratic Hints")}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {hints.map((hint, idx) => (
              <div
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5"
                key={`hint-card-${hint.order}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-heading text-xs">
                    {t("Hint {order}", { order: String(hint.order) })}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-rose-400">
                    <span>-</span>
                    <input
                      className="w-10 rounded border border-border bg-inset px-1 py-0.5 text-right text-xs"
                      onChange={(e) => {
                        const penaltyPoints = Number(e.target.value);
                        setHints((prev) =>
                          prev.map((h, i) =>
                            i === idx ? { ...h, penaltyPoints } : h
                          )
                        );
                      }}
                      type="number"
                      value={hint.penaltyPoints}
                    />
                    <span>pts</span>
                  </div>
                </div>
                <textarea
                  className="h-24 w-full rounded border border-border bg-inset p-2 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
                  onChange={(e) => {
                    const socraticPrompt = e.target.value;
                    setHints((prev) =>
                      prev.map((h, i) =>
                        i === idx ? { ...h, socraticPrompt } : h
                      )
                    );
                  }}
                  value={hint.socraticPrompt}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 5. Root Cause & Prevention */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-primary" size={16} />
              <h3 className="font-semibold text-heading text-xs uppercase tracking-wider">
                {t("Canonical Root Cause Breakdown *")}
              </h3>
            </div>
            <textarea
              className="h-32 w-full rounded-lg border border-border bg-inset p-3 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
              onChange={(e) => {
                setRootCauseSummary(e.target.value);
                if (fieldErrors.rootCauseSummary) {
                  setFieldErrors((prev) => {
                    const { rootCauseSummary: _omit, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              placeholder="Explain the failure mechanism, event loop or state lifecycle that triggers the bug..."
              value={rootCauseSummary}
            />
            {Boolean(fieldErrors.rootCauseSummary) && (
              <p className="text-destructive text-xs">
                {fieldErrors.rootCauseSummary}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-emerald-400" size={16} />
              <h3 className="font-semibold text-heading text-xs uppercase tracking-wider">
                {t("Prevention Notes & Safeguards")}
              </h3>
            </div>
            <textarea
              className="h-32 w-full rounded-lg border border-border bg-inset p-3 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
              onChange={(e) => setPreventionNotes(e.target.value)}
              placeholder="Recommended ESLint rules, architecture patterns, and regression tests..."
              value={preventionNotes}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 border-border border-t pt-4">
          <Button
            disabled={isSaving}
            onClick={() => handleSave("draft")}
            size="md"
            variant="outline"
          >
            <Save size={15} />
            {t("Save Challenge Draft")}
          </Button>
          <Button
            disabled={isSaving}
            onClick={() => handleSave("published")}
            size="md"
            variant="default"
          >
            <Play size={15} />
            {t("Publish to Arena")}
          </Button>
        </div>
      </div>
    </div>
  );
}
