import type { Category, StrengthPoint } from "../lib/types";
import type { LucideIcon } from "lucide-react";

export const PROFILE = {
  name: "Marcus Reyes",
  handle: "@mreyes",
  joined: "Joined Feb 2024",
  rank: "#128",
  points: "4,820",
  streak: "12-day streak",
};

export interface ProfileStat {
  label: string;
  value: string;
  Icon?: LucideIcon;
  iconColor?: string;
}

export const PROFILE_STATS: ProfileStat[] = [
  { label: "Challenges Solved", value: "37 / 104" },
  { label: "Avg. Score", value: "78" },
  { label: "Avg. Time to Fix", value: "28m" },
  { label: "Hints Used", value: "0.6" },
];

export interface RadarPoint {
  subject: string;
  score: number;
  fullMark: number;
}

export const RADAR_DATA: RadarPoint[] = [
  { subject: "React Rendering", score: 86, fullMark: 100 },
  { subject: "Backend Concurrency", score: 64, fullMark: 100 },
  { subject: "Distributed Systems", score: 51, fullMark: 100 },
  { subject: "Memory & Performance", score: 79, fullMark: 100 },
];

export interface SolvesByCategory {
  category: Category;
  solved: number;
  total: number;
}

export const SOLVES_BY_CATEGORY: SolvesByCategory[] = [
  { category: "react", solved: 14, total: 30 },
  { category: "concurrency", solved: 9, total: 28 },
  { category: "distributed", solved: 5, total: 26 },
  { category: "memory", solved: 9, total: 20 },
];

export interface CategoryStat {
  category: Category;
  score: number;
  solved: number;
}

export const CATEGORY_STATS: CategoryStat[] = SOLVES_BY_CATEGORY.map((s) => ({
  category: s.category,
  solved: s.solved,
  score: Math.round((s.solved / s.total) * 100),
}));

export const STRENGTH_DATA: StrengthPoint[] = [
  { name: "React", Easy: 6, Medium: 5, Hard: 2, Expert: 1 },
  { name: "Concurrency", Easy: 3, Medium: 3, Hard: 2, Expert: 1 },
  { name: "Distributed", Easy: 1, Medium: 2, Hard: 1, Expert: 1 },
  { name: "Memory", Easy: 4, Medium: 3, Hard: 1, Expert: 1 },
];

export interface CategoryBreakdownRow {
  category: Category;
  solved: number;
  total: number;
  avgScore: number;
  rootCauseAcc: number;
  trend: "improving" | "flat" | "weak spot";
}

export const CATEGORY_BREAKDOWN: CategoryBreakdownRow[] = [
  { category: "react", solved: 14, total: 30, avgScore: 86, rootCauseAcc: 91, trend: "improving" },
  { category: "concurrency", solved: 9, total: 28, avgScore: 64, rootCauseAcc: 58, trend: "flat" },
  { category: "distributed", solved: 5, total: 26, avgScore: 51, rootCauseAcc: 47, trend: "weak spot" },
  { category: "memory", solved: 9, total: 20, avgScore: 79, rootCauseAcc: 83, trend: "improving" },
];

export interface RecentSubmission {
  title: string;
  category: Category;
  score: number;
  pts: number;
}

export const RECENT_SUBMISSIONS: RecentSubmission[] = [
  { title: "Dashboard freezes after third click", category: "react", score: 82, pts: 100 },
  { title: "Memory grows unbounded during CSV export", category: "memory", score: 91, pts: 100 },
  { title: "Leader election flaps every 30s in prod", category: "distributed", score: 44, pts: 100 },
  { title: "Orders occasionally double-charge under load", category: "concurrency", score: 76, pts: 100 },
];
