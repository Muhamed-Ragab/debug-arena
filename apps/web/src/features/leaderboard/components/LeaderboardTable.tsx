import { Flame } from "lucide-react";
import type { LeaderboardEntry } from "../types";
import { Avatar } from "../../../components/ui/Avatar";
import { RankMedal } from "../../../components/ui/RankMedal";
import { cn } from "../../../lib/utils";

interface Props {
  entries: LeaderboardEntry[];
}

export default function LeaderboardTable({ entries }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr>
            {["Rank", "User", "Score", "Solved", "Streak"].map((col) => (
              <th
                key={col}
                className={cn(
                  "text-start text-[11px] text-zinc-700 font-medium uppercase tracking-wider pb-3 font-mono",
                  (col === "Score" || col === "Solved" || col === "Streak") && "text-end",
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((row) => (
            <tr
              key={row.rank}
              className="border-t transition-colors"
              style={{
                borderColor: "rgba(255,255,255,0.05)",
                backgroundColor: row.isUser ? "rgba(99,102,241,0.06)" : "transparent",
              }}
            >
              <td className="py-3 w-12">
                <RankMedal rank={row.rank} />
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={row.name} size={26} />
                  <span
                    className={cn(
                      "text-[13px]",
                      row.isUser ? "text-indigo-300 font-medium" : "text-zinc-300",
                    )}
                  >
                    {row.name}
                    {row.isUser && (
                      <span className="ms-2 text-[10px] text-indigo-500 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded">
                        you
                      </span>
                    )}
                  </span>
                </div>
              </td>
              <td className="py-3 text-end">
                <span className="font-mono text-[13px] text-zinc-300 tabular-nums">
                  {row.score.toLocaleString()}
                </span>
              </td>
              <td className="py-3 text-end">
                <span className="font-mono text-[13px] text-zinc-500 tabular-nums">{row.solved}</span>
              </td>
              <td className="py-3 text-end">
                <span
                  className="inline-flex items-center gap-1 font-mono text-[12px] tabular-nums"
                  style={{
                    color: row.streak >= 14 ? "#F97316" : row.streak >= 7 ? "#F59E0B" : "#4B5563",
                  }}
                >
                  {row.streak >= 7 && <Flame size={11} />}
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
