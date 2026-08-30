"use client";

import { Search } from "lucide-react";
import { useExtracted } from "next-intl";
import { Input } from "@/components/ui/input";
import { type SelectOption, SimpleSelect } from "@/components/ui/select";
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  DIFFICULTY_CONFIG,
  DIFFICULTY_ORDER,
} from "@/lib/domain/categories";
import type { Category, Difficulty } from "@/lib/domain/types";

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
  const t = useExtracted();

  function getCategoryLabel(
    categoryVal: Category,
    tFn: ReturnType<typeof useExtracted>
  ): string {
    switch (categoryVal) {
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
        return categoryVal;
    }
  }

  function getDifficultyLabel(
    difficultyVal: Difficulty,
    tFn: ReturnType<typeof useExtracted>
  ): string {
    switch (difficultyVal) {
      case "Easy":
        return tFn("Easy");
      case "Medium":
        return tFn("Medium");
      case "Hard":
        return tFn("Hard");
      case "Expert":
        return tFn("Expert");
      default:
        return difficultyVal;
    }
  }

  const categoryOptions: SelectOption[] = [
    { label: t("All Categories"), value: "all" },
    ...CATEGORY_ORDER.map((c) => ({
      indicatorColor: CATEGORY_CONFIG[c]?.color,
      label: getCategoryLabel(c, t),
      value: c,
    })),
  ];

  const difficultyOptions: SelectOption[] = [
    { label: t("All Levels"), value: "all" },
    ...DIFFICULTY_ORDER.map((d) => ({
      indicatorColor: DIFFICULTY_CONFIG[d]?.color,
      label: getDifficultyLabel(d, t),
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
          placeholder={t("Search challenges...")}
          value={search}
        />
      </div>

      {/* Select Filters from shadcn */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full min-w-[180px] sm:w-auto">
          <SimpleSelect
            onValueChange={(val) => onCategory(val as Category | "all")}
            options={categoryOptions}
            placeholder={t("Select Category")}
            value={category}
          />
        </div>

        <div className="w-full min-w-[150px] sm:w-auto">
          <SimpleSelect
            onValueChange={(val) => onDifficulty(val as Difficulty | "all")}
            options={difficultyOptions}
            placeholder={t("Select Level")}
            value={difficulty}
          />
        </div>
      </div>
    </div>
  );
}
