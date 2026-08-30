"use client";

import {
  Archive,
  Bot,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Lock,
  Search,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { DiffBadge } from "@/components/shared/DiffBadge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Difficulty } from "@/lib/domain";
import { flattenValidationErrors } from "@/lib/safe-action/validation";
import {
  deleteAdminChallengeAction,
  toggleChallengeStatusAction,
} from "../actions";
import { useAdminChallenges } from "../hooks/useAdminChallenges";
import type { AdminChallengeItem } from "../types";

interface AdminChallengeListProps {
  challenges?: AdminChallengeItem[];
  initialChallenges?: AdminChallengeItem[];
  initialTotal?: number;
  onRefresh?: () => void;
}

export function AdminChallengeList({
  challenges: legacyChallenges,
  initialChallenges,
  initialTotal,
  onRefresh,
}: AdminChallengeListProps) {
  const t = useExtracted();
  const resolvedInitialItems = initialChallenges ?? legacyChallenges ?? [];
  const resolvedInitialTotal = initialTotal ?? legacyChallenges?.length ?? 0;

  const {
    difficultyFilter,
    error,
    items,
    loading,
    page,
    pageSize,
    refetch,
    search,
    setDifficultyFilter,
    setPage,
    setPageSize,
    setSearch,
    setSourceFilter,
    setStatusFilter,
    sourceFilter,
    statusFilter,
    total,
    totalPages,
  } = useAdminChallenges({
    initialItems: resolvedInitialItems,
    initialTotal: resolvedInitialTotal,
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        toast.success(
          nextStatus === "published"
            ? t("Challenge published live to the arena!")
            : t("Challenge status set to draft.")
        );
        refetch();
        onRefresh?.();
      } else if (res?.validationErrors) {
        const flat = flattenValidationErrors(res.validationErrors);
        const msg =
          flat.challengeId ??
          flat.status ??
          flat._errors ??
          "Validation failed";
        toast.error(msg);
      } else if (res?.serverError) {
        toast.error(res.serverError);
      } else {
        toast.error(t("Something went wrong"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Something went wrong"));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await deleteAdminChallengeAction({
        challengeId: deleteTargetId,
      });
      if (res?.data?.success) {
        toast.success(t("Challenge deleted successfully."));
        refetch();
        onRefresh?.();
        setDeleteTargetId(null);
      } else if (res?.validationErrors) {
        const flat = flattenValidationErrors(res.validationErrors);
        const msg = flat.challengeId ?? flat._errors ?? "Validation failed";
        toast.error(msg);
      } else if (res?.serverError) {
        toast.error(res.serverError);
      } else {
        toast.error(t("Something went wrong"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Something went wrong"));
    } finally {
      setIsDeleting(false);
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
          {t("Published")}
        </Badge>
      );
    }
    if (status === "draft") {
      return (
        <Badge className="gap-1.5 font-medium" variant="warning">
          <Lock size={11} />
          {t("Draft")}
        </Badge>
      );
    }
    return (
      <Badge className="gap-1.5 font-medium" variant="secondary">
        <Archive size={11} />
        {t("Archived")}
      </Badge>
    );
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Bar */}
      <Card className="bg-surface/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              className="ps-9 pe-3 text-xs"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search challenges by title or category...")}
              type="text"
              value={search}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <Select
              onValueChange={(val) => setStatusFilter(val ?? "all")}
              value={statusFilter}
            >
              <SelectTrigger
                aria-label={t("Status")}
                className="h-9 min-w-36 rounded-lg border-border bg-inset px-3 text-foreground text-xs"
              >
                <SelectValue placeholder={t("All Statuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Statuses")}</SelectItem>
                <SelectItem value="published">{t("Published")}</SelectItem>
                <SelectItem value="draft">{t("Draft")}</SelectItem>
                <SelectItem value="archived">{t("Archived")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Source Filter */}
            <Select
              onValueChange={(val) => setSourceFilter(val ?? "all")}
              value={sourceFilter}
            >
              <SelectTrigger
                aria-label={t("Source")}
                className="h-9 min-w-36 rounded-lg border-border bg-inset px-3 text-foreground text-xs"
              >
                <SelectValue placeholder={t("All Sources")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Sources")}</SelectItem>
                <SelectItem value="ai_generated">
                  {t("AI Generated")}
                </SelectItem>
                <SelectItem value="manual">{t("Manual")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select
              onValueChange={(val) => setDifficultyFilter(val ?? "all")}
              value={difficultyFilter}
            >
              <SelectTrigger
                aria-label={t("Difficulty")}
                className="h-9 min-w-36 rounded-lg border-border bg-inset px-3 text-foreground text-xs"
              >
                <SelectValue placeholder={t("All Difficulties")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Difficulties")}</SelectItem>
                <SelectItem value="easy">{t("Easy")}</SelectItem>
                <SelectItem value="medium">{t("Medium")}</SelectItem>
                <SelectItem value="hard">{t("Hard")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive text-sm">
          {error}
        </div>
      ) : null}

      {/* Challenges Table */}
      <Card className="overflow-hidden bg-surface shadow-xs">
        <div className={loading ? "opacity-60 transition-opacity" : ""}>
          <Table>
            <TableHeader className="bg-inset/50">
              <TableRow>
                <TableHead className="px-4 py-3">{t("Challenge")}</TableHead>
                <TableHead className="px-4 py-3">{t("Category")}</TableHead>
                <TableHead className="px-4 py-3">{t("Difficulty")}</TableHead>
                <TableHead className="px-4 py-3">{t("Status")}</TableHead>
                <TableHead className="px-4 py-3">{t("Source")}</TableHead>
                <TableHead className="px-4 py-3">{t("Submissions")}</TableHead>
                <TableHead className="px-4 py-3 text-end">
                  {t("Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {items.length > 0 ? (
                items.map((c) => (
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
                          {t("AI Agent")}
                        </Badge>
                      ) : (
                        <Badge className="gap-1 font-medium" variant="outline">
                          <User size={11} />
                          {t("Manual")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {c.submissionsCount} {t("total")}
                        </span>
                        <span className="text-[11px] text-emerald-400">
                          {c.solvesCount} {t("solves")}
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
                              title={t("View in Arena")}
                              variant="ghost"
                            >
                              <Link
                                href={`/challenges/${c.id}`}
                                target="_blank"
                              >
                                <ExternalLink size={15} />
                              </Link>
                            </Button>
                            <Button
                              className="h-8 w-8 p-0 text-amber-400 hover:bg-amber-500/10 hover:text-amber-400"
                              onClick={() => handleToggleStatus(c.id, "draft")}
                              size="icon"
                              title={t("Unpublish to Draft")}
                              variant="ghost"
                            >
                              <Lock size={15} />
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="h-8 w-8 p-0 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                            onClick={() =>
                              handleToggleStatus(c.id, "published")
                            }
                            size="icon"
                            title={t("Publish to Arena")}
                            variant="ghost"
                          >
                            <Globe size={15} />
                          </Button>
                        )}
                        <Button
                          className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                          onClick={() => setDeleteTargetId(c.id)}
                          size="icon"
                          title={t("Delete Challenge")}
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
                    {loading
                      ? t("Loading...")
                      : t("No challenges found matching your filters.")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 border-border border-t bg-inset/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground text-xs">
            {total > 0
              ? t("Showing {from}–{to} of {total} challenges", {
                  from: String(from),
                  to: String(to),
                  total: String(total),
                })
              : t("No challenges found matching your filters.")}
            {totalPages > 0
              ? ` — ${t("Page {page} of {totalPages}", {
                  page: String(page),
                  totalPages: String(totalPages),
                })}`
              : ""}
          </div>

          <div className="flex items-center gap-2">
            <Select
              onValueChange={(val) => setPageSize(Number(val))}
              value={String(pageSize)}
            >
              <SelectTrigger
                aria-label={t("Rows per page")}
                className="h-8 min-w-20 rounded-lg border-border bg-background px-2 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                aria-label={t("Previous")}
                disabled={!canPrev || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                size="sm"
                variant="outline"
              >
                <ChevronLeft size={14} />
                {t("Previous")}
              </Button>
              <span className="px-2 text-xs tabular-nums">
                {t("Page {page} of {totalPages}", {
                  page: String(page),
                  totalPages: String(Math.max(1, totalPages)),
                })}
              </span>
              <Button
                aria-label={t("Next")}
                disabled={!canNext || loading}
                onClick={() => setPage((p) => p + 1)}
                size="sm"
                variant="outline"
              >
                {t("Next")}
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetId(null);
          }
        }}
        open={!!deleteTargetId}
      >
        <AlertDialogContent data-testid="confirm-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Are you sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete this challenge?")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              disabled={isDeleting}
              onClick={() => setDeleteTargetId(null)}
              variant="outline"
            >
              {t("Cancel")}
            </Button>
            <Button
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              variant="destructive"
            >
              {isDeleting ? t("Deleting...") : t("Permanently delete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
