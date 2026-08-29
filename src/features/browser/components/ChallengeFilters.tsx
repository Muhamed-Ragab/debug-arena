"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { type SelectOption, SimpleSelect } from "@/components/ui/select";
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  DIFFICULTY_CONFIG,
  DIFFICULTY_ORDER,
} from "@/lib/domain/categories";
import type { Category, Difficulty } from "@/lib/domain/types";

const CATEGORY_KEY_MAP: Record<string, string> = {
  "Backend Concurrency": "category.names.backendConcurrency",
  "Logic Inversions": "category.names.logicInversions",
  "Memory Leaks": "category.names.memoryLeaks",
  "Off-by-One": "category.names.offByOne",
  "Race Conditions": "category.names.raceConditions",
  "React Rendering": "category.names.reactRendering",
  "Security Flaws": "category.names.securityFlaws",
  "State Mutations": "category.names.stateMutations",
};

const DIFFICULTY_KEY_MAP: Record<string, string> = {
  Easy: "difficulty.easy",
  Expert: "difficulty.expert",
  Hard: "difficulty.hard",
  Medium: "difficulty.medium",
};

interface Props {
  category: Category | "all";
  difficulty: Difficulty | "all";
  onCategory: (c: Category | "all") => void;
  onDifficulty: (d: Difficulty | "all") => void;
  onSearch: (v: string) => void;
  search: string;
}

export function ChallengeFilters({
  search,
  onSearch,
  category,
  onCategory,
  difficulty,
  onDifficulty,
}: Props) {
  const t = useTranslations();
  const categoryOptions: SelectOption[] = [
    { label: t("browser.filters.allCategories"), value: "all" },
    ...CATEGORY_ORDER.map((c) => ({
      indicatorColor: CATEGORY_CONFIG[c]?.color,
      label: t(CATEGORY_KEY_MAP[c] ?? c),
      value: c,
    })),
  ];

  const difficultyOptions: SelectOption[] = [
    { label: t("browser.filters.allLevels"), value: "all" },
    ...DIFFICULTY_ORDER.map((d) => ({
      indicatorColor: DIFFICULTY_CONFIG[d]?.color,
      label: t(DIFFICULTY_KEY_MAP[d] ?? d),
      value: d,
    })),
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative min-w-[220px] flex-1">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <Input
          className="bg-card ps-10 pe-4"
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("browser.filters.search")}
          value={search}
        />
      </div>

      {/* Select Filters from shadcn */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full min-w-[180px] sm:w-auto">
          <SimpleSelect
            onValueChange={(val) => onCategory(val as Category | "all")}
            options={categoryOptions}
            placeholder={t("browser.filters.selectCategory")}
            value={category}
          />
        </div>

        <div className="w-full min-w-[150px] sm:w-auto">
          <SimpleSelect
            onValueChange={(val) => onDifficulty(val as Difficulty | "all")}
            options={difficultyOptions}
            placeholder={t("browser.filters.selectLevel")}
            value={difficulty}
          />
        </div>
      </div>
    </div>
  );
}
