"use client";

import { LeaderboardScreen } from "./components/LeaderboardScreen";
import type { LeaderboardEntry } from "./types";

interface Props {
  initialEntries: LeaderboardEntry[];
}

export function LeaderboardPage({ initialEntries }: Props) {
  return <LeaderboardScreen initialEntries={initialEntries} />;
}
