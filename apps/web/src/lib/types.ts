export type Screen = "browser" | "challenge" | "results" | "profile" | "leaderboard";

export type Category = "react" | "concurrency" | "distributed" | "memory";

export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export type RightTab = "explain" | "fix" | "hints";

export type LeaderboardTab = "week" | "alltime" | "react" | "concurrency" | "distributed";

export interface Challenge {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  teaser: string;
  points: number;
  timeLimit: string;
  solved: boolean;
  solves: number;
  time: string;
  filePath: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  solved: number;
  avgScore: number;
  strongest: Category;
  isUser?: boolean;
}

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

export interface ScorePart {
  label: string;
  score: number;
  max: number;
  desc: string;
}

export type DiffLineType = "ctx" | "add" | "del";

export interface DiffLine {
  type: DiffLineType;
  text: string;
}

export type FileTreeNode =
  | { type: "folder"; name: string; depth: number }
  | { type: "file"; name: string; depth: number; highlight?: boolean };
