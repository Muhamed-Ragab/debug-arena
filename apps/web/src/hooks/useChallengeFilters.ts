import { useMemo, useState } from "react";
import type { Category, Challenge, Difficulty } from "../lib/types";

export interface ChallengeFilters {
  catFilter: Category | null;
  diffFilter: Difficulty | null;
  query: string;
  setCatFilter: (c: Category | null) => void;
  setDiffFilter: (d: Difficulty | null) => void;
  setQuery: (q: string) => void;
  toggleCategory: (c: Category) => void;
  toggleDifficulty: (d: Difficulty) => void;
  filtered: Challenge[];
}

export function useChallengeFilters(challenges: Challenge[]): ChallengeFilters {
  const [catFilter, setCatFilter] = useState<Category | null>(null);
  const [diffFilter, setDiffFilter] = useState<Difficulty | null>(null);
  const [query, setQuery] = useState("");

  const toggleCategory = (c: Category) =>
    setCatFilter((prev) => (prev === c ? null : c));
  const toggleDifficulty = (d: Difficulty) =>
    setDiffFilter((prev) => (prev === d ? null : d));

  const filtered = useMemo(
    () =>
      challenges.filter((c) => {
        if (catFilter && c.category !== catFilter) return false;
        if (diffFilter && c.difficulty !== diffFilter) return false;
        if (query && !c.title.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [challenges, catFilter, diffFilter, query],
  );

  return {
    catFilter,
    diffFilter,
    query,
    setCatFilter,
    setDiffFilter,
    setQuery,
    toggleCategory,
    toggleDifficulty,
    filtered,
  };
}
