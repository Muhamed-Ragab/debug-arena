import type { LeaderboardEntry } from "../lib/types";

export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Daniel Osei", score: 9860, solved: 71, avgScore: 92, strongest: "distributed" },
  { rank: 2, name: "Priya Nadar", score: 9140, solved: 66, avgScore: 89, strongest: "react" },
  { rank: 3, name: "Lucas Ferreira", score: 8705, solved: 63, avgScore: 87, strongest: "concurrency" },
  { rank: 4, name: "Sofia Marchetti", score: 8412, solved: 61, avgScore: 84, strongest: "distributed" },
  { rank: 5, name: "Ken Watanabe", score: 8190, solved: 58, avgScore: 81, strongest: "concurrency" },
  { rank: 6, name: "Elena Petrova", score: 7955, solved: 54, avgScore: 88, strongest: "react" },
  { rank: 7, name: "Tobias Klein", score: 7510, solved: 50, avgScore: 77, strongest: "memory" },
  { rank: 8, name: "Amara Okafor", score: 7204, solved: 47, avgScore: 80, strongest: "distributed" },
  { rank: 128, name: "Marcus Reyes", score: 4820, solved: 37, avgScore: 78, strongest: "react", isUser: true },
];

export const LEADERBOARD_TABS = [
  { id: "week", label: "Week" },
  { id: "alltime", label: "All Time" },
  { id: "react", label: "React" },
  { id: "concurrency", label: "Concurrency" },
  { id: "distributed", label: "Distributed" },
] as const;

export type LeaderboardTabId = (typeof LEADERBOARD_TABS)[number]["id"];
