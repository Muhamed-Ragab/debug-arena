import type { CategoryDTO } from "@/features/category/types";

export type LeaderboardTab = "week" | "alltime" | `category:${string}`;

export interface LeaderboardTabOption {
  category?: CategoryDTO;
  id: LeaderboardTab;
}

export function buildLeaderboardTabs(
  categories: readonly CategoryDTO[]
): LeaderboardTabOption[] {
  return [
    { id: "week" },
    { id: "alltime" },
    ...categories.map((category) => ({
      category,
      id: `category:${category.slug}` as const,
    })),
  ];
}
