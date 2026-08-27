import type { LucideIcon } from "lucide-react";
import type { Category } from "@/lib/domain/types";
import type { StrengthPoint } from "../types";

export interface ProfileInfo {
  avatarColor?: string;
  bio: string;
  handle: string;
  image?: string | null;
  jobTitle?: string;
  joined: string;
  name: string;
  points: string;
  rank: string;
  streak: string;
}

export const PROFILE: ProfileInfo = {
  avatarColor: "#4f46e5",
  bio: "",
  handle: "@developer",
  image: null,
  jobTitle: "Software Engineer",
  joined: "Member",
  name: "Developer",
  points: "0",
  rank: "#--",
  streak: "0-day streak",
};

export interface ProfileStat {
  Icon?: LucideIcon;
  iconColor?: string;
  label: string;
  value: string;
}

export const PROFILE_STATS: ProfileStat[] = [
  { label: "Challenges Solved", value: "37 / 104" },
  { label: "Avg. Score", value: "78" },
  { label: "Avg. Time to Fix", value: "28m" },
  { label: "Hints Used", value: "0.6" },
];

export interface RadarPoint {
  fullMark: number;
  score: number;
  subject: string;
}

export const RADAR_DATA: RadarPoint[] = [
  { fullMark: 100, score: 86, subject: "State Mutations" },
  { fullMark: 100, score: 64, subject: "Race Conditions" },
  { fullMark: 100, score: 51, subject: "Security Flaws" },
  { fullMark: 100, score: 79, subject: "Memory Leaks" },
];

export interface SolvesByCategory {
  category: Category;
  solved: number;
  total: number;
}

export const SOLVES_BY_CATEGORY: SolvesByCategory[] = [
  { category: "State Mutations", solved: 14, total: 30 },
  { category: "Race Conditions", solved: 9, total: 28 },
  { category: "Security Flaws", solved: 5, total: 26 },
  { category: "Memory Leaks", solved: 9, total: 20 },
];

export interface CategoryStat {
  category: Category;
  score: number;
  solved: number;
}

export const CATEGORY_STATS: CategoryStat[] = SOLVES_BY_CATEGORY.map((s) => ({
  category: s.category,
  score: Math.round((s.solved / s.total) * 100),
  solved: s.solved,
}));

export const STRENGTH_DATA: StrengthPoint[] = [
  { Easy: 6, Expert: 1, Hard: 2, Medium: 5, name: "State Mutations" },
  { Easy: 3, Expert: 1, Hard: 2, Medium: 3, name: "Race Conditions" },
  { Easy: 1, Expert: 1, Hard: 1, Medium: 2, name: "Security Flaws" },
  { Easy: 4, Expert: 1, Hard: 1, Medium: 3, name: "Memory Leaks" },
];

export interface CategoryBreakdownRow {
  avgScore: number;
  category: Category;
  rootCauseAcc: number;
  solved: number;
  total: number;
  trend: "improving" | "flat" | "weak spot";
}

export const CATEGORY_BREAKDOWN: CategoryBreakdownRow[] = [
  {
    avgScore: 86,
    category: "State Mutations",
    rootCauseAcc: 91,
    solved: 14,
    total: 30,
    trend: "improving",
  },
  {
    avgScore: 64,
    category: "Race Conditions",
    rootCauseAcc: 58,
    solved: 9,
    total: 28,
    trend: "flat",
  },
  {
    avgScore: 51,
    category: "Security Flaws",
    rootCauseAcc: 47,
    solved: 5,
    total: 26,
    trend: "weak spot",
  },
  {
    avgScore: 79,
    category: "Memory Leaks",
    rootCauseAcc: 83,
    solved: 9,
    total: 20,
    trend: "improving",
  },
];

export interface RecentSubmission {
  category: Category;
  pts: number;
  score: number;
  title: string;
}

export const RECENT_SUBMISSIONS: RecentSubmission[] = [
  {
    category: "State Mutations",
    pts: 100,
    score: 82,
    title: "Dashboard freezes after third click",
  },
  {
    category: "Memory Leaks",
    pts: 100,
    score: 91,
    title: "Memory grows unbounded during CSV export",
  },
  {
    category: "Race Conditions",
    pts: 100,
    score: 44,
    title: "Leader election flaps every 30s in prod",
  },
  {
    category: "Race Conditions",
    pts: 100,
    score: 76,
    title: "Orders occasionally double-charge under load",
  },
];
