import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { RankMedal } from "@/components/ui/RankMedal";
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
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedEntries = entries.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-130 border-collapse">
          <thead>
            <tr>
              {["Rank", "User", "Score", "Solved", "Streak"].map((col) => (
                <th
                  className={cn(
                    "pb-3 text-start font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider",
                    (col === "Score" || col === "Solved" || col === "Streak") &&
                      "text-end"
                  )}
                  key={col}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedEntries.map((row) => (
              <tr
                className={cn(
                  "border-border border-t transition-colors hover:bg-white/2",
                  row.isUser && "bg-primary/10"
                )}
                key={row.rank}
              >
                <td className="w-12 px-4 py-3">
                  <RankMedal rank={row.rank} />
                </td>
                <td className="py-3">
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
                        <span className="ms-2 rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                          you
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-end">
                  <span className="font-mono text-[13px] text-foreground tabular-nums">
                    {row.score.toLocaleString()}
                  </span>
                </td>
                <td className="py-3 text-end">
                  <span className="font-mono text-[13px] text-muted-foreground tabular-nums">
                    {row.solved}
                  </span>
                </td>
                <td className="px-4 py-3 text-end">
                  <span
                    className="inline-flex items-center gap-1 font-mono text-[12px] tabular-nums"
                    style={{ color: getStreakColor(row.streak) }}
                  >
                    {row.streak >= 7 ? <Flame size={11} /> : null}
                    {row.streak}d
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-border border-t pt-4">
          <p className="text-muted-foreground text-xs">
            Showing {(safePage - 1) * pageSize + 1} to{" "}
            {Math.min(safePage * pageSize, entries.length)} of {entries.length}{" "}
            entries
          </p>
          <div className="flex items-center gap-1">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-40"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                className={`h-8 min-w-8 rounded-md border px-2.5 font-medium text-xs transition-colors ${
                  p === safePage
                    ? "border-primary bg-primary/10 font-semibold text-heading"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
                key={p}
                onClick={() => setPage(p)}
                type="button"
              >
                {p}
              </button>
            ))}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-40"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              type="button"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
