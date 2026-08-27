"use client";

import { useLingui } from "@lingui/react";
import {
  AlertCircle,
  CheckCircle2,
  FileCode,
  FilePlus,
  Flame,
  Layers,
  Lightbulb,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  TestTube,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FormattedMarkdown } from "@/components/ui/FormattedMarkdown";
import { saveAdminChallengeAction } from "../actions";
import {
  type ChallengeFile,
  type ChallengeHiddenTest,
  type ChallengeHint,
  type DiffLine,
  computeUnifiedDiff,
  detectBuggyLines,
} from "../lib/question-generator-agent";

interface CategoryOption {
  description: string | null;
  id: string;
  name: string;
  slug: string;
}

interface ManualChallengeCreatorProps {
  categories: CategoryOption[];
  onChallengeSaved?: () => void;
}

export function ManualChallengeCreator({
  categories,
  onChallengeSaved,
}: ManualChallengeCreatorProps) {
  const { i18n } = useLingui();

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
      code: `export function App() {\n  // Insert buggy code here\n  return <div>Debug Arena</div>;\n}`,
      isEntry: true,
      name: "App.tsx",
    },
  ]);
  const [buggyLines, setBuggyLines] = useState<[number, number]>([2, 2]);

  // Fixed Files & Diff
  const [fixedFiles, setFixedFiles] = useState<ChallengeFile[]>([
    {
      code: `export function App() {\n  // Insert fixed code here\n  return <div>Debug Arena</div>;\n}`,
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
  const [hiddenTests, setHiddenTests] = useState<ChallengeHiddenTest[]>([
    {
      description: "Verify state synchronization under sequential updates",
      name: "Handles sequential transitions correctly",
      testCode: "expect(result).toBe(true);",
    },
  ]);

  // States
  const [isSaving, setIsSaving] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

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
      toast.error(i18n._("Challenge must have at least one file."));
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
        i18n._(
          "Auto-calculated diff and detected buggy lines: [{start}, {end}]",
          { start: lines[0], end: lines[1] }
        )
      );
    }
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) {
      toast.error(i18n._("Challenge title is required."));
      return;
    }
    if (!prompt.trim()) {
      toast.error(i18n._("Scenario prompt is required."));
      return;
    }
    if (!rootCauseSummary.trim()) {
      toast.error(i18n._("Root cause summary is required."));
      return;
    }

    setIsSaving(true);
    try {
      const entryBuggy = buggyFiles.find((f) => f.isEntry) || buggyFiles[0];
      const entryFixed =
        fixedFiles.find((f) => f.name === entryBuggy?.name) || fixedFiles[0];
      const computedDiff =
        diffLines.length > 0
          ? diffLines
          : entryBuggy && entryFixed
            ? computeUnifiedDiff(entryBuggy.code, entryFixed.code)
            : [];

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

  return (
    <div className="flex flex-col gap-6">
      {/* Form Container */}
      <div className="flex flex-col gap-6 rounded-xl border border-border bg-surface/80 p-6 shadow-md backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FilePlus size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-heading">
                {i18n._("Manual Challenge Authoring Studio")}
              </h2>
              <p className="text-muted-foreground text-xs">
                {i18n._(
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
              {i18n._("Save Draft")}
            </Button>
            <Button
              disabled={isSaving}
              onClick={() => handleSave("published")}
              size="sm"
              variant="primary"
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
                {i18n._("Challenge created and published successfully!")}
              </span>
            </div>
            <Link
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1 font-semibold text-xs text-black hover:bg-emerald-400 transition-colors"
              href={`/challenges/${publishedId}`}
              target="_blank"
            >
              {i18n._("Play in Arena")} →
            </Link>
          </div>
        )}

        {/* 1. Core Metadata */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-1.5 block font-semibold text-xs text-heading">
              {i18n._("Challenge Title *")}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-inset px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Race Condition in Distributed Cache Store"
              type="text"
              value={title}
            />
          </div>

          <div className="md:col-span-3">
            <label className="mb-1.5 block font-semibold text-xs text-heading">
              {i18n._("Category *")}
            </label>
            <select
              className="w-full rounded-lg border border-border bg-inset px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
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
            <label className="mb-1.5 block font-semibold text-xs text-heading">
              {i18n._("Difficulty *")}
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-inset p-1">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  className={`rounded py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    difficulty === d
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  key={d}
                  onClick={() => handleDifficultyChange(d)}
                  type="button"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="mb-1.5 block font-semibold text-xs text-heading">
              {i18n._("Language")}
            </label>
            <select
              className="w-full rounded-lg border border-border bg-inset px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
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

          <div className="md:col-span-3">
            <label className="mb-1.5 block font-semibold text-xs text-heading">
              {i18n._("Format")}
            </label>
            <select
              className="w-full rounded-lg border border-border bg-inset px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              onChange={(e) =>
                setFormat(
                  e.target.value as "code_snippet" | "log_only" | "ui_recording"
                )
              }
              value={format}
            >
              <option value="code_snippet">
                {i18n._("Code Snippet / Multi-file")}
              </option>
              <option value="log_only">{i18n._("Log Trace Only")}</option>
              <option value="ui_recording">{i18n._("UI Recording")}</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="mb-1.5 block font-semibold text-xs text-heading">
              {i18n._("Points")}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-inset px-3.5 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
              onChange={(e) => setPoints(Number(e.target.value))}
              type="number"
              value={points}
            />
          </div>

          <div className="md:col-span-3">
            <label className="mb-1.5 block font-semibold text-xs text-heading">
              {i18n._("Time Limit")}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-inset px-3.5 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
              onChange={(e) => setTimeLimit(e.target.value)}
              type="text"
              value={timeLimit}
            />
          </div>
        </div>

        {/* 2. Scenario Prompt */}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-inset/40 p-4">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-xs text-heading uppercase tracking-wider">
              {i18n._("Scenario Markdown Description *")}
            </label>
            <button
              className="font-semibold text-xs text-primary hover:underline"
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              type="button"
            >
              {showPromptPreview
                ? i18n._("Edit Raw Markdown")
                : i18n._("Preview Formatted Markdown")}
            </button>
          </div>

          {showPromptPreview ? (
            <div className="min-h-48 rounded-lg border border-border bg-card p-4">
              <FormattedMarkdown content={prompt} />
            </div>
          ) : (
            <textarea
              className="h-48 w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              value={prompt}
            />
          )}
        </div>

        {/* 3. Buggy Files & Reference Fixes */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="text-primary" size={16} />
              <h3 className="font-semibold text-sm text-heading">
                {i18n._("Challenge Files & Bug Injection")}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAutoComputeDiff}
                size="sm"
                variant="outline"
              >
                <RotateCcw size={13} />
                {i18n._("Auto-Compute Diff & Lines")}
              </Button>
              <Button onClick={handleAddFile} size="sm" variant="outline">
                <Plus size={13} />
                {i18n._("Add File")}
              </Button>
            </div>
          </div>

          {/* Files Grid */}
          {buggyFiles.map((file, idx) => (
            <div
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
              key={`file-${idx}-${file.name}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    className="rounded border border-border bg-inset px-2.5 py-1 font-mono text-xs text-heading font-semibold focus:border-primary focus:outline-none"
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
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
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
                    <span>{i18n._("Entry File")}</span>
                  </label>
                </div>

                {buggyFiles.length > 1 && (
                  <button
                    className="text-rose-400 hover:text-rose-300"
                    onClick={() => handleRemoveFile(idx)}
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Buggy Code vs Fixed Code Comparison */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] text-amber-400 font-semibold">
                    {i18n._("Buggy Code ({name})", { name: file.name })}
                  </span>
                  <textarea
                    className="h-52 w-full rounded border border-border bg-black/80 p-3 font-mono text-xs text-amber-100 focus:border-primary focus:outline-none"
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
                  <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                    {i18n._("Fixed Reference Code ({name})", {
                      name: file.name,
                    })}
                  </span>
                  <textarea
                    className="h-52 w-full rounded border border-border bg-black/80 p-3 font-mono text-xs text-emerald-100 focus:border-primary focus:outline-none"
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
              {i18n._("Buggy Lines Location (1-Indexed):")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{i18n._("Start:")}</span>
              <input
                className="w-16 rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                onChange={(e) =>
                  setBuggyLines([Number(e.target.value), buggyLines[1]])
                }
                type="number"
                value={buggyLines[0]}
              />
              <span className="text-muted-foreground">{i18n._("End:")}</span>
              <input
                className="w-16 rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                onChange={(e) =>
                  setBuggyLines([buggyLines[0], Number(e.target.value)])
                }
                type="number"
                value={buggyLines[1]}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {i18n._(
                "(Players get graded on whether their selected lines overlap this range)"
              )}
            </span>
          </div>

          {/* Fix Explanation */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-heading">
              {i18n._("Reference Fix Explanation")}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-inset px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
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
            <h3 className="font-semibold text-sm text-heading">
              {i18n._("Progressive Socratic Hints")}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {hints.map((hint, idx) => (
              <div
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5"
                key={`hint-card-${hint.order}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-heading">
                    {i18n._("Hint {order}", { order: hint.order })}
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
                  className="h-24 w-full rounded border border-border bg-inset p-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
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
              <h3 className="font-semibold text-xs text-heading uppercase tracking-wider">
                {i18n._("Canonical Root Cause Breakdown *")}
              </h3>
            </div>
            <textarea
              className="h-32 w-full rounded-lg border border-border bg-inset p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              onChange={(e) => setRootCauseSummary(e.target.value)}
              placeholder="Explain the failure mechanism, event loop or state lifecycle that triggers the bug..."
              value={rootCauseSummary}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-emerald-400" size={16} />
              <h3 className="font-semibold text-xs text-heading uppercase tracking-wider">
                {i18n._("Prevention Notes & Safeguards")}
              </h3>
            </div>
            <textarea
              className="h-32 w-full rounded-lg border border-border bg-inset p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              onChange={(e) => setPreventionNotes(e.target.value)}
              placeholder="Recommended ESLint rules, architecture patterns, and regression tests..."
              value={preventionNotes}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            disabled={isSaving}
            onClick={() => handleSave("draft")}
            size="md"
            variant="outline"
          >
            <Save size={15} />
            {i18n._("Save Challenge Draft")}
          </Button>
          <Button
            disabled={isSaving}
            onClick={() => handleSave("published")}
            size="md"
            variant="primary"
          >
            <Play size={15} />
            {i18n._("Publish to Arena")}
          </Button>
        </div>
      </div>
    </div>
  );
}
