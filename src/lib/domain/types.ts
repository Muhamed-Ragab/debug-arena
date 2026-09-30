export type Screen =
  | "landing"
  | "challenges"
  | "workspace"
  | "leaderboard"
  | "profile"
  | "analytics"
  | "admin";

export type Category = string;

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Challenge {
  category: Category;
  categoryColor?: string | null;
  categoryIcon?: string | null;
  categorySlug?: string;
  description?: string;
  difficulty: Difficulty;
  filePath?: string;
  id: string;
  points?: number;
  score?: number;
  solved?: boolean;
  solves?: number;
  teaser?: string;
  time?: string;
  timeLimit?: string | number;
  title: string;
}
