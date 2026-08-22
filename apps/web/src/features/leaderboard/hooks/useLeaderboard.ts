import { useState } from "react";
import type { Category } from "../../../lib/types";
import type { LeaderboardTab } from "../types";

export interface LeaderboardState {
  tab: LeaderboardTab;
  setTab: (t: LeaderboardTab) => void;
  categoryTab: Category | null;
}

const CATEGORY_TABS: Category[] = ["react", "concurrency", "distributed"];

export function useLeaderboard(): LeaderboardState {
  const [tab, setTab] = useState<LeaderboardTab>("week");
  const categoryTab = CATEGORY_TABS.includes(tab as Category) ? (tab as Category) : null;
  return { tab, setTab, categoryTab };
}
