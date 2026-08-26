import { Flame } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RankMedal } from "@/components/ui/RankMedal";
import { LEADERBOARD } from "@/features/leaderboard/data/leaderboard";
import { CATEGORY_CONFIG } from "@/lib/domain/categories";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "../types";

const MEDAL_ACCENT: Record<number, string> = {
  1: "#fbbf24",
  2: "#cbd5e1",
  3: "#d97706",
};

function TopThreeCard({ entry }: { entry: LeaderboardEntry }) {
  const accent = MEDAL_ACCENT[entry.rank] ?? "#3f3f46";
  const category = CATEGORY_CONFIG[entry.strongest];
  const CategoryIcon = category?.Icon;
  const isFirst = entry.rank === 1;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50",
        isFirst && "ring-1 ring-[#fbbf24]/40"
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-center gap-3">
        <RankMedal rank={entry.rank} />
        <Avatar name={entry.name} size={44} />
        <div className="min-w-0">
          <p className="truncate font-medium text-heading">{entry.name}</p>
          <p className="text-muted-foreground text-xs">
            {entry.solved} solved · avg {entry.avgScore}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Score</p>
          <p className="font-mono text-foreground tabular-nums">
            {entry.score.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Solved</p>
          <p className="font-mono text-foreground tabular-nums">
            {entry.solved}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Streak</p>
          <p className="flex items-center gap-1 font-mono text-foreground tabular-nums">
            <Flame aria-hidden className="h-3.5 w-3.5 text-orange-400" />
            {entry.streak}d
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Strongest</p>
          {Boolean(category) && (
            <span
              className="mt-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-xs"
              style={{
                backgroundColor: category.bg,
                border: `1px solid ${category.border}`,
                color: category.color,
              }}
            >
              {CategoryIcon ? (
                <CategoryIcon aria-hidden className="h-3 w-3" />
              ) : null}
              {category.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function LeaderboardTopThree({
  entries,
}: {
  entries?: LeaderboardEntry[];
}) {
  const top3 = (entries ?? LEADERBOARD).slice(0, 3);

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-start">
      {top3.map((entry, idx) => {
        let orderClass = "";
        let podiumClass = "";
        if (idx === 0) {
          orderClass = "order-1 sm:order-2";
          podiumClass = "shadow-lg shadow-[#fbbf24]/10";
        } else if (idx === 1) {
          orderClass = "order-2 sm:order-1";
          podiumClass = "sm:mt-3";
        } else {
          orderClass = "order-3 sm:order-3";
          podiumClass = "sm:mt-3";
        }

        return (
          <div className={cn(orderClass, podiumClass)} key={entry.rank}>
            <TopThreeCard entry={entry} />
          </div>
        );
      })}
    </div>
  );
}
