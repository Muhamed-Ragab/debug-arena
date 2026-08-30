"use client";

import { useExtracted } from "next-intl";
import { useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { CATEGORY_CONFIG } from "@/lib/domain/categories";
import type { Category } from "@/lib/domain/types";
import { useLeaderboard } from "../hooks/useLeaderboard";
import type { LeaderboardEntry } from "../types";
import { LeaderboardTable } from "./LeaderboardTable";
import { LeaderboardTabs } from "./LeaderboardTabs";
import { LeaderboardTopThree } from "./LeaderboardTopThree";

interface Props {
  initialEntries: LeaderboardEntry[];
}

export function LeaderboardScreen({ initialEntries }: Props) {
  const t = useExtracted();
  const { tab, setTab, categoryTab } = useLeaderboard();

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

  const filteredEntries = useMemo(() => {
    const list = initialEntries;
    if (!categoryTab) {
      return list;
    }
    const matching = list.filter((e) => e.strongest === categoryTab);
    return matching.length > 0
      ? matching.map((e, idx) => ({ ...e, rank: idx + 1 }))
      : list;
  }, [categoryTab, initialEntries]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar crumbs={[{ label: t("Arena") }, { label: t("Leaderboard") }]} />

      <div className="border-border border-b bg-surface px-4 pt-4 pb-0 sm:px-8">
        <div className="mb-4">
          <h1 className="font-semibold text-2xl text-heading tracking-tight">
            {t("Leaderboard")}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {t(
              "Top debuggers ranked by accuracy, streak, and diagnosis speed. (Cached 24h)"
            )}
          </p>
        </div>
        <LeaderboardTabs setTab={setTab} tab={tab} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {categoryTab
          ? (() => {
              const cfg = CATEGORY_CONFIG[categoryTab];
              const Icon = cfg?.Icon;
              return (
                <div
                  className="mb-4 flex items-center gap-2 rounded-lg border px-3 py-2.5"
                  style={{
                    backgroundColor: cfg?.bg,
                    borderColor: cfg?.border,
                  }}
                >
                  {Icon ? (
                    <Icon size={13} style={{ color: cfg.color }} />
                  ) : null}
                  <span
                    className="font-medium text-[12px]"
                    style={{ color: cfg?.color }}
                  >
                    {t("{label} — top solvers ranked by category score", {
                      label: cfg
                        ? getCategoryLabel(categoryTab, t)
                        : categoryTab,
                    })}
                  </span>
                </div>
              );
            })()
          : null}

        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border border-dashed py-16 text-center">
            <p className="font-medium text-heading">
              {t("No leaderboard data yet")}
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              {t("Solve challenges to earn a spot on the leaderboard.")}
            </p>
          </div>
        ) : (
          <>
            <LeaderboardTopThree entries={filteredEntries} />
            <LeaderboardTable entries={filteredEntries} />
          </>
        )}
      </div>
    </div>
  );
}
