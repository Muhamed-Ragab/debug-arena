"use client";

import { useLingui } from "@lingui/react";
import {
  Archive,
  Bot,
  ExternalLink,
  Globe,
  Lock,
  Search,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { DiffBadge } from "@/components/shared/DiffBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      // biome-ignore lint/suspicious/noAlert: destructive admin action; native confirm dialog is acceptable here
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

  const renderStatus = (status: string) => {
    if (status === "published") {
      return (
        <Badge className="gap-1.5 font-medium" variant="success">
          <Globe size={11} />
          {i18n._("Published")}
        </Badge>
      );
    }
    if (status === "draft") {
      return (
        <Badge className="gap-1.5 font-medium" variant="warning">
          <Lock size={11} />
          {i18n._("Draft")}
        </Badge>
      );
    }
    return (
      <Badge className="gap-1.5 font-medium" variant="secondary">
        <Archive size={11} />
        {i18n._("Archived")}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Bar */}
      <Card className="bg-surface/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              className="ps-9 pe-3 text-xs"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={i18n._("Search challenges by title or category...")}
              type="text"
              value={search}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              className="rounded-lg border border-border bg-inset px-3 py-2 text-foreground text-xs focus:border-primary focus:outline-none"
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
              className="rounded-lg border border-border bg-inset px-3 py-2 text-foreground text-xs focus:border-primary focus:outline-none"
              onChange={(e) => setSourceFilter(e.target.value)}
              value={sourceFilter}
            >
              <option value="all">{i18n._("All Sources")}</option>
              <option value="ai_generated">{i18n._("AI Generated")}</option>
              <option value="manual">{i18n._("Manual")}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Challenges Table */}
      <Card className="overflow-hidden bg-surface shadow-xs">
        <Table>
          <TableHeader className="bg-inset/50">
            <TableRow>
              <TableHead className="px-4 py-3">{i18n._("Challenge")}</TableHead>
              <TableHead className="px-4 py-3">{i18n._("Category")}</TableHead>
              <TableHead className="px-4 py-3">
                {i18n._("Difficulty")}
              </TableHead>
              <TableHead className="px-4 py-3">{i18n._("Status")}</TableHead>
              <TableHead className="px-4 py-3">{i18n._("Source")}</TableHead>
              <TableHead className="px-4 py-3">
                {i18n._("Submissions")}
              </TableHead>
              <TableHead className="px-4 py-3 text-end">
                {i18n._("Actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {filteredChallenges.length > 0 ? (
              filteredChallenges.map((c) => (
                <TableRow
                  className="transition-colors hover:bg-inset/40"
                  key={c.id}
                >
                  <TableCell className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-heading text-sm">
                        {c.title}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        ID: {c.id.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Badge variant="secondary">{c.categoryName}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <DiffBadge difficulty={formatDifficulty(c.difficulty)} />
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {renderStatus(c.status)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {c.source === "ai_generated" ? (
                      <Badge className="gap-1 font-medium" variant="default">
                        <Bot size={11} />
                        {i18n._("AI Agent")}
                      </Badge>
                    ) : (
                      <Badge className="gap-1 font-medium" variant="outline">
                        <User size={11} />
                        {i18n._("Manual")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">
                        {c.submissionsCount} {i18n._("total")}
                      </span>
                      <span className="text-[11px] text-emerald-400">
                        {c.solvesCount} {i18n._("solves")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.status === "published" ? (
                        <>
                          <Button
                            asChild
                            className="h-8 w-8 p-0"
                            size="icon"
                            title={i18n._("View in Arena")}
                            variant="ghost"
                          >
                            <Link href={`/challenges/${c.id}`} target="_blank">
                              <ExternalLink size={15} />
                            </Link>
                          </Button>
                          <Button
                            className="h-8 w-8 p-0 text-amber-400 hover:bg-amber-500/10 hover:text-amber-400"
                            onClick={() => handleToggleStatus(c.id, "draft")}
                            size="icon"
                            title={i18n._("Unpublish to Draft")}
                            variant="ghost"
                          >
                            <Lock size={15} />
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="h-8 w-8 p-0 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                          onClick={() => handleToggleStatus(c.id, "published")}
                          size="icon"
                          title={i18n._("Publish to Arena")}
                          variant="ghost"
                        >
                          <Globe size={15} />
                        </Button>
                      )}
                      <Button
                        className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                        onClick={() => handleDelete(c.id)}
                        size="icon"
                        title={i18n._("Delete Challenge")}
                        variant="ghost"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={7}
                >
                  {i18n._("No challenges found matching your filters.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
