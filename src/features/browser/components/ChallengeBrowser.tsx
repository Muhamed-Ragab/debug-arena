"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { CHALLENGES } from "@/features/challenge/data/challenges";
import type { Category, Challenge, Difficulty } from "@/lib/domain/types";
import { ChallengeCard } from "./ChallengeCard";
import { ChallengeFilters } from "./ChallengeFilters";

const PAGE_SIZE = 6;

const STATS = [
  { label: "Solved", value: "37 / 104" },
  { label: "Current Streak", value: "12 days" },
  { label: "Rank", value: "#128" },
];

export function ChallengeBrowser({
  initialChallenges = CHALLENGES,
}: {
  initialChallenges?: Challenge[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialChallenges.filter((c) => {
      if (category !== "all" && c.category !== category) {
        return false;
      }
      if (difficulty !== "all" && c.difficulty !== difficulty) {
        return false;
      }
      if (
        q &&
        !c.title.toLowerCase().includes(q) &&
        !c.filePath?.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [search, category, difficulty, initialChallenges.filter]);

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
            Challenges
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Pick a bug, read the scenario, and ship a root-cause diagnosis.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <div
              className="rounded-xl border border-border bg-card p-4"
              key={s.label}
            >
              <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
                {s.label}
              </p>
              <p className="mt-1 font-semibold text-heading text-xl">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <ChallengeFilters
            category={category}
            difficulty={difficulty}
            onCategory={(c) => {
              setCategory(c);
              setPage(1);
            }}
            onDifficulty={(d) => {
              setDifficulty(d);
              setPage(1);
            }}
            onSearch={setSearch}
            search={search}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((c) => (
            <ChallengeCard challenge={c} key={c.id} />
          ))}
        </div>

        {pageItems.length === 0 && (
          <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
            No challenges match the current filters.
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-1">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-40"
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              className={`h-9 min-w-9 rounded-md border px-3 font-medium text-sm transition-colors ${
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
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-40"
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
