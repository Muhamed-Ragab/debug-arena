import { Flame } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RankMedal } from "@/components/ui/RankMedal";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "../types";

interface Props {
  entries: LeaderboardEntry[];
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

export function LeaderboardTable({ entries }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
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
          {entries.map((row) => (
            <tr
              className={cn(
                "border-border border-t transition-colors hover:bg-white/[0.02]",
                row.isUser && "bg-primary/10"
              )}
              key={row.rank}
            >
              <td className="w-12 py-3">
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
              <td className="py-3 text-end">
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
  );
}
