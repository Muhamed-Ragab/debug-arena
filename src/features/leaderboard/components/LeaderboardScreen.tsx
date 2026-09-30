"use client";
import { TopBar } from "@/components/layout/TopBar";
import type { CategoryDTO } from "@/features/category/types";
import { getCategoryAppearance } from "@/lib/domain/categories";
import { useLeaderboard } from "../hooks/useLeaderboard";
import type { LeaderboardEntry } from "../types";
import { LeaderboardTable } from "./LeaderboardTable";
import { LeaderboardTabs } from "./LeaderboardTabs";
import { LeaderboardTopThree } from "./LeaderboardTopThree";

interface Props {
  categories: CategoryDTO[];
  initialEntries: LeaderboardEntry[];
}

export function LeaderboardScreen({ categories, initialEntries }: Props) {
  const { entries, isPending, tab, setTab, categoryTab } =
    useLeaderboard(initialEntries);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar crumbs={[{ label: "Arena" }, { label: "Leaderboard" }]} />

      <div className="border-border border-b bg-surface px-4 pt-4 pb-0 sm:px-8">
        <div className="mb-4">
          <h1 className="font-semibold text-2xl text-heading tracking-tight">
            {"Leaderboard"}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {
              "Ranked by earned challenge points. Weekly rankings cover the last seven days."
            }
          </p>
        </div>
        <LeaderboardTabs categories={categories} setTab={setTab} tab={tab} />
      </div>

      <div
        aria-busy={isPending}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-8"
      >
        {categoryTab
          ? (() => {
              const selectedCategory = categories.find(
                (category) => category.slug === categoryTab
              );
              const cfg = selectedCategory
                ? getCategoryAppearance(selectedCategory)
                : null;
              const Icon = cfg?.Icon;
              if (!selectedCategory) {
                return null;
              }
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
                    {`${selectedCategory.name} — top solvers ranked by category score`}
                  </span>
                </div>
              );
            })()
          : null}

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border border-dashed py-16 text-center">
            <p className="font-medium text-heading">
              {"No leaderboard data yet"}
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              {"Solve challenges to earn a spot on the leaderboard."}
            </p>
          </div>
        ) : (
          <>
            <LeaderboardTopThree categories={categories} entries={entries} />
            <LeaderboardTable entries={entries} />
          </>
        )}
      </div>
    </div>
  );
}
