import type * as schema from "@/db/schema";

export type UserRow = typeof schema.users.$inferSelect;
export type ChallengeRow = typeof schema.challenges.$inferSelect;
export type SubmissionRow = typeof schema.submissions.$inferSelect;
export type CategoryRow = typeof schema.categories.$inferSelect;

export interface AnalyticsRepository {
  avgScorePerCategory: () => Promise<
    Array<{
      avgScore: number;
      categoryId: string;
      categoryName: string;
      count: number;
    }>
  >;
  countChallengesByStatus: () => Promise<
    Array<{ count: number; status: string }>
  >;
  countSubmissionsByDay: (
    days?: number
  ) => Promise<Array<{ count: number; date: string }>>;
  countUsers: () => Promise<number>;
  getSolveRate: () => Promise<{ rate: number; solved: number; total: number }>;
  topCategories: (
    limit?: number
  ) => Promise<
    Array<{ attempts: number; categoryId: string; categoryName: string }>
  >;
}

export interface ChallengeStatusCount {
  count: number;
  status: string;
}

export interface SubmissionsByDay {
  count: number;
  date: string;
}

export interface CategoryAvgScore {
  avgScore: number;
  categoryId: string;
  categoryName: string;
  count: number;
}

export interface TopCategory {
  attempts: number;
  categoryId: string;
  categoryName: string;
}

export interface SolveRate {
  rate: number;
  solved: number;
  total: number;
}

export interface AnalyticsOverview {
  avgScorePerCategory: CategoryAvgScore[];
  challengesByStatus: ChallengeStatusCount[];
  solveRate: SolveRate;
  submissionsByDay: SubmissionsByDay[];
  topCategories: TopCategory[];
  totalChallenges: number;
  totalSubmissions: number;
  totalUsers: number;
}
