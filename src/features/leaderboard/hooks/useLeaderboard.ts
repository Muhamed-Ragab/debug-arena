"use client";

import { useRef, useState, useTransition } from "react";
import { getLeaderboardAction } from "../actions";
import type { LeaderboardEntry, LeaderboardTab } from "../types";

export interface LeaderboardState {
  categoryTab: string | null;
  entries: LeaderboardEntry[];
  isPending: boolean;
  setTab: (t: LeaderboardTab) => void;
  tab: LeaderboardTab;
}

export function useLeaderboard(
  initialEntries: LeaderboardEntry[]
): LeaderboardState {
  const [tab, setTab] = useState<LeaderboardTab>("week");
  const [entries, setEntries] = useState(initialEntries);
  const [isPending, startTransition] = useTransition();
  const latestRequest = useRef(0);
  const categoryTab = tab.startsWith("category:")
    ? tab.slice("category:".length)
    : null;

  function selectTab(nextTab: LeaderboardTab) {
    setTab(nextTab);
    latestRequest.current += 1;
    const requestId = latestRequest.current;
    startTransition(async () => {
      const result = await getLeaderboardAction({
        categorySlug: nextTab.startsWith("category:")
          ? nextTab.slice("category:".length)
          : null,
        period: nextTab === "week" ? "weekly" : "all_time",
      });
      if (requestId === latestRequest.current && result?.data?.success) {
        setEntries(result.data.entries);
      }
    });
  }

  return { categoryTab, entries, isPending, setTab: selectTab, tab };
}
