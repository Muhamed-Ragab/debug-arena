import type { Category } from "../../lib/types";

export type LeaderboardTab = "week" | "alltime" | "react" | "concurrency" | "distributed";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  solved: number;
  avgScore: number;
  strongest: Category;
  streak: number;
  isUser?: boolean;
}
