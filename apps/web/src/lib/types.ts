export type Screen = "browser" | "challenge" | "results" | "profile" | "leaderboard";

export type Category = "react" | "concurrency" | "distributed" | "memory";

export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

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
