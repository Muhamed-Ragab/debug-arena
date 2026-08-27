export type Screen =
  | "landing"
  | "challenges"
  | "workspace"
  | "leaderboard"
  | "profile"
  | "analytics"
  | "admin";

export type Category =
  | "React Rendering"
  | "Backend Concurrency"
  | "Race Conditions"
  | "Off-by-One"
  | "Memory Leaks"
  | "Security Flaws"
  | "Logic Inversions"
  | "State Mutations";

export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export interface Challenge {
  category: Category;
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
