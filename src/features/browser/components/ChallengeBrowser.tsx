"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/card";
import { ResponsivePagination } from "@/components/ui/pagination";
import { usePaginatedChallenges } from "@/features/browser/hooks/usePaginatedChallenges";
import type { CategoryDTO } from "@/features/category/types";
import type { Challenge, Difficulty } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { ChallengeCard } from "./ChallengeCard";
import { ChallengeFilters } from "./ChallengeFilters";

export interface ChallengeBrowserStat {
  label: string;
  value: string;
}

export interface ChallengeBrowserProps {
  categories: CategoryDTO[];
  initialCategory?: string;
  initialChallenges: Challenge[];
  initialDifficulty?: string;
  initialPage?: number;
  initialPageSize?: number;
  initialSearch?: string;
  initialTotal?: number;
  initialTotalPages?: number;
  stats: ChallengeBrowserStat[];
  userId?: string | null;
}

export function ChallengeBrowser({
  categories,
  initialCategory,
  initialChallenges,
  initialDifficulty,
  initialPage = 1,
  initialPageSize = 6,
  initialSearch,
  initialTotal,
  initialTotalPages,
  stats,
  userId = null,
}: ChallengeBrowserProps) {
  const getStatLabel = (key: string): string => {
    switch (key) {
      case "browser.stats.solved":
        return "Solved";
      case "browser.stats.currentStreak":
        return "Current Streak";
      case "browser.stats.rank":
        return "Rank";
      default:
        return key;
    }
  };

  const {
    category,
    challenges,
    difficulty,
    loading,
    page,
    pageSize,
    search,
    setCategory,
    setDifficulty,
    setPage,
    setSearch,
    total,
    totalPages,
  } = usePaginatedChallenges({
    initialCategory,
    initialChallenges,
    initialDifficulty,
    initialPage,
    initialPageSize,
    initialSearch,
    initialTotal,
    initialTotalPages,
    userId,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar crumbs={[{ label: "Arena" }, { label: "Challenges" }]} />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mb-6">
          <h1 className="font-semibold text-2xl text-heading tracking-tight">
            {"Challenges"}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {"Pick a bug, read the scenario, and ship a root-cause diagnosis."}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card className="p-4" key={s.label}>
              <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
                {getStatLabel(s.label)}
              </p>
              <p className="mt-1 font-semibold text-heading text-xl">
                {s.value}
              </p>
            </Card>
          ))}
        </div>

        <div className="mb-6">
          <ChallengeFilters
            categories={categories}
            category={category}
            difficulty={(difficulty ?? "all") as Difficulty | "all"}
            onCategory={(c) => setCategory(c)}
            onDifficulty={(d) => setDifficulty(d)}
            onSearch={setSearch}
            search={search}
          />
        </div>

        <div
          className={cn(
            "grid grid-cols-1 gap-4 transition-opacity duration-200 md:grid-cols-2 xl:grid-cols-3",
            loading && "pointer-events-none opacity-60"
          )}
        >
          {challenges.map((c) => (
            <ChallengeCard challenge={c} key={c.id} />
          ))}
        </div>

        {challenges.length === 0 && !loading && (
          <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
            {"No challenges match the current filters."}
          </div>
        )}

        <div className="mt-8">
          <ResponsivePagination
            currentPage={page}
            disabled={loading}
            onPageChange={setPage}
            pageSize={pageSize}
            totalItems={total}
            totalPages={totalPages}
          />
        </div>
      </div>
    </div>
  );
}
