"use client";

import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RankMedal } from "@/components/shared/RankMedal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "../types";

interface Props {
  entries: LeaderboardEntry[];
  pageSize?: number;
}

function getStreakColor(streak: number): string {
  if (streak >= 14) {
    return "#F97316";
  }
  if (streak >= 7) {
    return "#F59E0B";
  }
  return "#6B7280";
}

export function LeaderboardTable({ entries, pageSize = 10 }: Props) {
  const t = useTranslations();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedEntries = entries.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16">
              {t("leaderboard.table.rank")}
            </TableHead>
            <TableHead>{t("leaderboard.table.user")}</TableHead>
            <TableHead className="text-end">
              {t("leaderboard.table.score")}
            </TableHead>
            <TableHead className="text-end">
              {t("leaderboard.table.solved")}
            </TableHead>
            <TableHead className="text-end">
              {t("leaderboard.table.streak")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedEntries.map((row) => (
            <TableRow
              className={cn(
                "transition-colors",
                row.isUser && "bg-primary/10 hover:bg-primary/15"
              )}
              key={row.rank}
            >
              <TableCell className="w-16 px-3 py-3">
                <RankMedal rank={row.rank} />
              </TableCell>
              <TableCell className="py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={row.name} size={26} />
                  <span
                    className={cn(
                      "text-[13px]",
                      row.isUser
                        ? "font-semibold text-primary"
                        : "text-foreground"
                    )}
                  >
                    {row.name}
                    {Boolean(row.isUser) && (
                      <Badge
                        className="ms-2 font-mono text-[10px]"
                        variant="default"
                      >
                        {t("leaderboard.table.youBadge")}
                      </Badge>
                    )}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-3 text-end font-mono text-[13px] text-foreground tabular-nums">
                {row.score.toLocaleString()}
              </TableCell>
              <TableCell className="py-3 text-end font-mono text-[13px] text-muted-foreground tabular-nums">
                {row.solved}
              </TableCell>
              <TableCell className="px-3 py-3 text-end">
                <span
                  className="inline-flex items-center gap-1 font-mono text-[12px] tabular-nums"
                  style={{ color: getStreakColor(row.streak) }}
                >
                  {row.streak >= 7 ? <Flame size={11} /> : null}
                  {t("leaderboard.table.streakDays", { streak: row.streak })}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-border border-t pt-4">
          <p className="text-muted-foreground text-xs">
            {t("leaderboard.table.pagination", {
              from: (safePage - 1) * pageSize + 1,
              to: Math.min(safePage * pageSize, entries.length),
              total: entries.length,
            })}
          </p>
          <div className="flex items-center gap-1">
            <Button
              className="h-8 w-8 p-0"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              size="sm"
              variant="outline"
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                className="h-8 min-w-8 px-2.5 text-xs"
                key={p}
                onClick={() => setPage(p)}
                size="sm"
                variant={p === safePage ? "default" : "outline"}
              >
                {p}
              </Button>
            ))}
            <Button
              className="h-8 w-8 p-0"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              size="sm"
              variant="outline"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
