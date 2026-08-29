import type * as schema from "@/db/schema";
import type { Category } from "@/lib/domain/types";

export type UserRow = typeof schema.users.$inferSelect;
export type SubmissionRow = typeof schema.submissions.$inferSelect;
export type CategoryRow = typeof schema.categories.$inferSelect;
export type CategoryStatRow = typeof schema.userCategoryStats.$inferSelect;

export type UserWithSubmissions = (UserRow & {
  submissions: SubmissionRow[];
})[];

export type UserWithCategoryStatsAndSubmissions = UserRow & {
  categoryStats: (CategoryStatRow & { category: CategoryRow | null })[];
  submissions: SubmissionRow[];
};

export interface LeaderboardRepository {
  findAllUsersWithSubmissions: () => Promise<UserWithSubmissions>;
  findAllWithCategoryStats: () => Promise<
    UserWithCategoryStatsAndSubmissions[]
  >;
  findByIdWithRelations: (
    userId: string
  ) => Promise<UserWithCategoryStatsAndSubmissions | null>;
}

export interface UserWithSubmissionsAndStats {
  categoryStats: Array<{
    avgScore: number;
    category?: { name: string } | null;
  }>;
  currentRating: number;
  displayName: string | null;
  id: string;
  name: string | null;
  streakCount: number;
  submissions: Array<{
    fixCorrect: boolean | null;
    totalScore: number | null;
  }>;
}

export interface GetLeaderboardOptions {
  categorySlug?: string | null;
  currentUserId?: string | null;
  limit?: number;
  period?: "weekly" | "all_time";
}

export type LeaderboardTab =
  | "week"
  | "alltime"
  | "State Mutations"
  | "Race Conditions"
  | "Security Flaws"
  | "Memory Leaks";

export interface LeaderboardEntry {
  avgScore: number;
  isUser?: boolean;
  name: string;
  rank: number;
  score: number;
  solved: number;
  streak: number;
  strongest: Category;
  userId?: string;
}
