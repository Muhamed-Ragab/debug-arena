import { useState } from "react";
import type { Category } from "@/lib/domain/types";
import type { LeaderboardTab } from "../types";

export interface LeaderboardState {
  categoryTab: Category | null;
  setTab: (t: LeaderboardTab) => void;
  tab: LeaderboardTab;
}

const CATEGORY_TABS: Category[] = [
  "State Mutations",
  "Race Conditions",
  "Security Flaws",
  "Memory Leaks",
];

export function useLeaderboard(): LeaderboardState {
  const [tab, setTab] = useState<LeaderboardTab>("week");
  const categoryTab = CATEGORY_TABS.includes(tab as Category)
    ? (tab as Category)
    : null;
  return { categoryTab, setTab, tab };
}
