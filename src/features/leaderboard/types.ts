import type { Category } from "@/lib/domain/types";

export type LeaderboardTab =
  | "week"
  | "alltime"
  | "State Mutations"
  | "Race Conditions"
  | "Security Flaws"
  | "Memory Leaks";

export interface LeaderboardEntry {
  avgScore: number;
  isUser?: boolean;
  name: string;
  rank: number;
  score: number;
  solved: number;
  streak: number;
  strongest: Category;
  userId?: string;
}
