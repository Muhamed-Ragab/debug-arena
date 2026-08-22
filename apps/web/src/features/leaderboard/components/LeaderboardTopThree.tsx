import { Flame } from "lucide-react";

import { cn } from "../../../lib/utils";
import { CATEGORY_CONFIG } from "../../../lib/categories";
import { RankMedal } from "../../../components/ui/RankMedal";
import { Avatar } from "../../../components/ui/Avatar";
import { LEADERBOARD } from "../data/leaderboard";
import type { LeaderboardEntry } from "../types";

const MEDAL_ACCENT: Record<number, string> = {
  1: "#fbbf24",
  2: "#cbd5e1",
  3: "#d97706",
};

function TopThreeCard({ entry }: { entry: LeaderboardEntry }) {
  const accent = MEDAL_ACCENT[entry.rank] ?? "#3f3f46";
  const category = CATEGORY_CONFIG[entry.strongest];
  const CategoryIcon = category.Icon;
  const isFirst = entry.rank === 1;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50",
        isFirst && "ring-1 ring-[#fbbf24]/40"
      )}
    >
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ backgroundColor: accent }}
        aria-hidden
      />

      <div className="flex items-center gap-3">
        <RankMedal rank={entry.rank} />
        <Avatar name={entry.name} size={44} />
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{entry.name}</p>
          <p className="text-xs text-muted-foreground">
            {entry.solved} solved · avg {entry.avgScore}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Score</p>
          <p className="font-mono tabular-nums text-foreground">
            {entry.score.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Solved</p>
          <p className="font-mono tabular-nums text-foreground">{entry.solved}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Streak</p>
          <p className="flex items-center gap-1 font-mono tabular-nums text-foreground">
            <Flame className="h-3.5 w-3.5 text-orange-400" aria-hidden />
            {entry.streak}d
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Strongest</p>
          <span
            className="mt-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium"
            style={{
              color: category.color,
              backgroundColor: `color-mix(in srgb, ${category.color} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${category.color} 32%, transparent)`,
            }}
          >
            <CategoryIcon className="h-3 w-3" aria-hidden />
            {category.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LeaderboardTopThree({ entries }: { entries?: LeaderboardEntry[] }) {
  const top3 = (entries ?? LEADERBOARD).slice(0, 3);

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-start">
      {top3.map((entry, idx) => {
        let orderClass = "";
        let podiumClass = "";
        if (idx === 0) {
          orderClass = "order-1 sm:order-2";
          podiumClass = "shadow-lg shadow-[#fbbf24]/10"; // Highlighted but flush with top
        } else if (idx === 1) {
          orderClass = "order-2 sm:order-1";
          podiumClass = "sm:mt-3"; // Subtly pushed down
        } else {
          orderClass = "order-3 sm:order-3";
          podiumClass = "sm:mt-3"; // Subtly pushed down
        }

        return (
          <div key={entry.rank} className={cn(orderClass, podiumClass)}>
            <TopThreeCard entry={entry} />
          </div>
        );
      })}
    </div>
  );
}
