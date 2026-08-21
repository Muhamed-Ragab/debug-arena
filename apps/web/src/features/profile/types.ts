import type { Category, Difficulty } from "../../lib/types";

export interface RadarPoint {
  subject: string;
  score: number;
  fullMark: number;
}

export interface StrengthPoint {
  name: string;
  Easy: number;
  Medium: number;
  Hard: number;
  Expert: number;
}

export interface RecentSubmission {
  title: string;
  category: Category;
  score: number;
  pts: number;
}
