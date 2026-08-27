"use client";

import { useLingui } from "@lingui/react";
import {
  Archive,
  Bot,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCode,
  Globe,
  Lock,
  Search,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { DiffBadge } from "@/components/ui/DiffBadge";
import type { Difficulty } from "@/lib/domain";
import {
  deleteAdminChallengeAction,
  toggleChallengeStatusAction,
} from "../actions";

export interface AdminChallengeItem {
  buggyArtifact: unknown;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  createdAt: Date;
  difficulty: "easy" | "medium" | "hard";
  format: "code_snippet" | "log_only" | "ui_recording";
  hints: unknown[];
  id: string;
  preventionNotes: string | null;
  prompt: string;
  referenceFix: unknown;
  rootCauseSummary: string;
  solvesCount: number;
  source: "manual" | "ai_generated" | "postmortem_import";
  status: "draft" | "published" | "archived";
  submissionsCount: number;
  title: string;
}

interface AdminChallengeListProps {
  challenges: AdminChallengeItem[];
  onRefresh?: () => void;
}

export function AdminChallengeList({
  challenges: initialChallenges,
  onRefresh,
}: AdminChallengeListProps) {
  const { i18n } = useLingui();
  const [challenges, setChallenges] = useState(initialChallenges);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const filteredChallenges = challenges.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.categoryName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSource = sourceFilter === "all" || c.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleToggleStatus = async (
    challengeId: string,
    nextStatus: "draft" | "published" | "archived"
  ) => {
    try {
      const res = await toggleChallengeStatusAction({
        challengeId,
        status: nextStatus,
      });

      if (res?.data?.success) {
        setChallenges((prev) =>
          prev.map((item) =>
            item.id === challengeId ? { ...item, status: nextStatus } : item
          )
        );
        toast.success(
          nextStatus === "published"
            ? i18n._("Challenge published live to the arena!")
            : i18n._("Challenge status set to draft.")
        );
        onRefresh?.();
      } else if (res?.serverError) {
        toast.error(res.serverError);
      }
    } catch (err) {
      console.error(err);
      toast.error(i18n._("Failed to update status."));
    }
  };

  const handleDelete = async (challengeId: string) => {
    if (
      !window.confirm(i18n._("Are you sure you want to delete this challenge?"))
    ) {
      return;
    }

    try {
      const res = await deleteAdminChallengeAction({ challengeId });
      if (res?.data?.success) {
        setChallenges((prev) => prev.filter((item) => item.id !== challengeId));
        toast.success(i18n._("Challenge deleted successfully."));
        onRefresh?.();
      } else if (res?.serverError) {
        toast.error(res.serverError);
      }
    } catch (err) {
      console.error(err);
      toast.error(i18n._("Failed to delete challenge."));
    }
  };

  const formatDifficulty = (d: "easy" | "medium" | "hard"): Difficulty => {
    switch (d) {
      case "easy":
        return "Easy";
      case "medium":
        return "Medium";
      case "hard":
        return "Hard";
      default:
        return "Medium";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            className="w-full rounded-lg border border-border bg-inset py-2 ps-9 pe-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            onChange={(e) => setSearch(e.target.value)}
            placeholder={i18n._("Search challenges by title or category...")}
            type="text"
            value={search}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            className="rounded-lg border border-border bg-inset px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            <option value="all">{i18n._("All Statuses")}</option>
            <option value="published">{i18n._("Published")}</option>
            <option value="draft">{i18n._("Draft")}</option>
            <option value="archived">{i18n._("Archived")}</option>
          </select>

          {/* Source Filter */}
          <select
            className="rounded-lg border border-border bg-inset px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            onChange={(e) => setSourceFilter(e.target.value)}
            value={sourceFilter}
          >
            <option value="all">{i18n._("All Sources")}</option>
            <option value="ai_generated">{i18n._("AI Generated")}</option>
            <option value="manual">{i18n._("Manual")}</option>
          </select>
        </div>
      </div>

      {/* Challenges Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-inset/50 font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">{i18n._("Challenge")}</th>
                <th className="px-4 py-3">{i18n._("Category")}</th>
                <th className="px-4 py-3">{i18n._("Difficulty")}</th>
                <th className="px-4 py-3">{i18n._("Status")}</th>
                <th className="px-4 py-3">{i18n._("Source")}</th>
                <th className="px-4 py-3">{i18n._("Submissions")}</th>
                <th className="px-4 py-3 text-right">{i18n._("Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredChallenges.length > 0 ? (
                filteredChallenges.map((c) => (
                  <tr
                    className="hover:bg-inset/40 transition-colors"
                    key={c.id}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-heading text-sm">
                          {c.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          ID: {c.id.slice(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-inset px-2 py-0.5 text-xs text-foreground font-medium">
                        {c.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <DiffBadge difficulty={formatDifficulty(c.difficulty)} />
                    </td>
                    <td className="px-4 py-3.5">
                      {c.status === "published" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-medium text-[11px] text-emerald-400">
                          <Globe size={11} />
                          {i18n._("Published")}
                        </span>
                      ) : c.status === "draft" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-medium text-[11px] text-amber-400">
                          <Lock size={11} />
                          {i18n._("Draft")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-2.5 py-0.5 font-medium text-[11px] text-zinc-400">
                          <Archive size={11} />
                          {i18n._("Archived")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {c.source === "ai_generated" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <Bot size={11} />
                          {i18n._("AI Agent")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-inset px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <User size={11} />
                          {i18n._("Manual")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {c.submissionsCount} {i18n._("total")}
                        </span>
                        <span className="text-[11px] text-emerald-400">
                          {c.solvesCount} {i18n._("solves")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status === "published" ? (
                          <>
                            <Link
                              className="rounded p-1.5 text-muted-foreground hover:bg-inset hover:text-foreground"
                              href={`/challenges/${c.id}`}
                              target="_blank"
                              title={i18n._("View in Arena")}
                            >
                              <ExternalLink size={15} />
                            </Link>
                            <button
                              className="rounded p-1.5 text-amber-400 hover:bg-amber-500/10"
                              onClick={() => handleToggleStatus(c.id, "draft")}
                              title={i18n._("Unpublish to Draft")}
                              type="button"
                            >
                              <Lock size={15} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="rounded p-1.5 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() =>
                              handleToggleStatus(c.id, "published")
                            }
                            title={i18n._("Publish to Arena")}
                            type="button"
                          >
                            <Globe size={15} />
                          </button>
                        )}
                        <button
                          className="rounded p-1.5 text-rose-400 hover:bg-rose-500/10"
                          onClick={() => handleDelete(c.id)}
                          title={i18n._("Delete Challenge")}
                          type="button"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    {i18n._("No challenges found matching your filters.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
