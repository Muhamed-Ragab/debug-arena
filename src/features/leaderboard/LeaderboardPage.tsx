"use client";

import type { CategoryDTO } from "@/features/category/types";
import { LeaderboardScreen } from "./components/LeaderboardScreen";
import type { LeaderboardEntry } from "./types";

interface Props {
  categories: CategoryDTO[];
  initialEntries: LeaderboardEntry[];
}

export function LeaderboardPage({ categories, initialEntries }: Props) {
  return (
    <LeaderboardScreen
      categories={categories}
      initialEntries={initialEntries}
    />
  );
}
