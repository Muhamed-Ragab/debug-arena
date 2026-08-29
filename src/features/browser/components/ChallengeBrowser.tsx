"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useChallengeFilters } from "@/features/browser/hooks/useChallengeFilters";
import type { Category, Challenge, Difficulty } from "@/lib/domain/types";
import { ChallengeCard } from "./ChallengeCard";
import { ChallengeFilters } from "./ChallengeFilters";

const PAGE_SIZE = 6;

export interface ChallengeBrowserStat {
  label: string;
  value: string;
}

export function ChallengeBrowser({
  initialChallenges,
  stats,
}: {
  initialChallenges: Challenge[];
  stats: ChallengeBrowserStat[];
}) {
  const t = useTranslations();
  const [page, setPage] = useState(1);

  const {
    query,
    setQuery,
    catFilter,
    setCatFilter,
    diffFilter,
    setDiffFilter,
    filtered,
  } = useChallengeFilters(initialChallenges);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar crumbs={[{ label: "Arena" }, { label: "Challenges" }]} />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mb-6">
          <h1 className="font-semibold text-2xl text-heading tracking-tight">
            {t("common.navigation.challenges")}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {t("browser.subtitle")}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card className="p-4" key={s.label}>
              <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
                {t(s.label as string)}
              </p>
              <p className="mt-1 font-semibold text-heading text-xl">
                {s.value}
              </p>
            </Card>
          ))}
        </div>

        <div className="mb-6">
          <ChallengeFilters
            category={(catFilter ?? "all") as Category | "all"}
            difficulty={(diffFilter ?? "all") as Difficulty | "all"}
            onCategory={(c) => {
              setCatFilter(c === "all" ? null : c);
              setPage(1);
            }}
            onDifficulty={(d) => {
              setDiffFilter(d === "all" ? null : d);
              setPage(1);
            }}
            onSearch={setQuery}
            search={query}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((c) => (
            <ChallengeCard challenge={c} key={c.id} />
          ))}
        </div>

        {pageItems.length === 0 && (
          <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
            {t("browser.empty")}
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-1">
          <Button
            className="h-9 w-9 p-0"
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            size="sm"
            variant="outline"
          >
            <ChevronLeft size={16} />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              className="h-9 min-w-9 px-3 text-sm"
              key={p}
              onClick={() => setPage(p)}
              size="sm"
              variant={p === safePage ? "default" : "outline"}
            >
              {p}
            </Button>
          ))}
          <Button
            className="h-9 w-9 p-0"
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            size="sm"
            variant="outline"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
