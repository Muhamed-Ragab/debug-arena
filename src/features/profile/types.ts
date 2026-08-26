import type { Category } from "@/lib/domain/types";

export interface RadarPoint {
  fullMark: number;
  score: number;
  subject: string;
}

export interface StrengthPoint {
  Easy: number;
  Expert: number;
  Hard: number;
  Medium: number;
  name: string;
}

export interface RecentSubmission {
  category: Category;
  pts: number;
  score: number;
  title: string;
}
