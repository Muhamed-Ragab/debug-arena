"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type SelectOption, SimpleSelect } from "@/components/ui/select";
import type { CategoryDTO } from "@/features/category/types";
import { DIFFICULTY_CONFIG, DIFFICULTY_ORDER } from "@/lib/domain/categories";
import type { Difficulty } from "@/lib/domain/types";

interface Props {
  categories: CategoryDTO[];
  category: string;
  difficulty: Difficulty | "all";
  onCategory: (c: string) => void;
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
  categories,
}: Props) {
  const getDifficultyLabel = (difficultyVal: Difficulty): string => {
    switch (difficultyVal) {
      case "Easy":
        return "Easy";
      case "Medium":
        return "Medium";
      case "Hard":
        return "Hard";
      default:
        return difficultyVal;
    }
  };

  const categoryOptions: SelectOption[] = [
    { label: "All Categories", value: "all" },
    ...categories.map((categoryItem) => ({
      indicatorColor: categoryItem.color ?? undefined,
      label: categoryItem.name,
      value: categoryItem.slug,
    })),
  ];

  const difficultyOptions: SelectOption[] = [
    { label: "All Levels", value: "all" },
    ...DIFFICULTY_ORDER.map((d) => ({
      indicatorColor: DIFFICULTY_CONFIG[d]?.color,
      label: getDifficultyLabel(d),
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
          placeholder={"Search challenges..."}
          value={search}
        />
      </div>

      {/* Select Filters from shadcn */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full min-w-[180px] sm:w-auto">
          <SimpleSelect
            onValueChange={(val) => onCategory(val)}
            options={categoryOptions}
            placeholder={"Select Category"}
            value={category}
          />
        </div>

        <div className="w-full min-w-[150px] sm:w-auto">
          <SimpleSelect
            onValueChange={(val) => onDifficulty(val as Difficulty | "all")}
            options={difficultyOptions}
            placeholder={"Select Level"}
            value={difficulty}
          />
        </div>
      </div>
    </div>
  );
}
