"use client";

import { Flame } from "lucide-react";
import { useExtracted } from "next-intl";
import { RankMedal } from "@/components/shared/RankMedal";
import { Avatar } from "@/components/ui/avatar";
import { CATEGORY_CONFIG } from "@/lib/domain/categories";
import type { Category } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "../types";

const MEDAL_ACCENT: Record<number, string> = {
  1: "#fbbf24",
  2: "#cbd5e1",
  3: "#d97706",
};

function TopThreeCard({ entry }: { entry: LeaderboardEntry }) {
  const t = useExtracted();

  function getCategoryLabel(
    category: Category,
    tFn: ReturnType<typeof useExtracted>
  ): string {
    switch (category) {
      case "Backend Concurrency":
        return tFn("Backend Concurrency");
      case "Logic Inversions":
        return tFn("Logic Inversions");
      case "Memory Leaks":
        return tFn("Memory Leaks");
      case "Off-by-One":
        return tFn("Off-by-One");
      case "Race Conditions":
        return tFn("Race Conditions");
      case "React Rendering":
        return tFn("React Rendering");
      case "Security Flaws":
        return tFn("Security Flaws");
      case "State Mutations":
        return tFn("State Mutations");
      default:
        return category;
    }
  }

  const accent = MEDAL_ACCENT[entry.rank] ?? "#3f3f46";
  const category = CATEGORY_CONFIG[entry.strongest as Category];
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
            {t("{solved} solved · avg {avg}", {
              avg: String(entry.avgScore),
              solved: String(entry.solved),
            })}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">{t("Score")}</p>
          <p className="font-mono text-foreground tabular-nums">
            {entry.score.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t("Solved")}</p>
          <p className="font-mono text-foreground tabular-nums">
            {entry.solved}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t("Streak")}</p>
          <p className="flex items-center gap-1 font-mono text-foreground tabular-nums">
            <Flame aria-hidden className="h-3.5 w-3.5 text-orange-400" />
            {t("{streak}d", { streak: String(entry.streak) })}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t("Strongest")}</p>
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
              {getCategoryLabel(entry.strongest as Category, t)}
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
  entries: LeaderboardEntry[];
}) {
  const t = useExtracted();
  const top3 = entries.slice(0, 3);

  if (top3.length === 0) {
    return (
      <div className="mb-8 flex flex-col items-center justify-center rounded-lg border border-border border-dashed py-12 text-center">
        <p className="font-medium text-heading">{t("No top solvers yet")}</p>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("Be the first to climb the podium.")}
        </p>
      </div>
    );
  }

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
