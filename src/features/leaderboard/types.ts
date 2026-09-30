import type * as schema from "@/db/schema";
import type { Category } from "@/lib/domain/types";

export type { LeaderboardTab } from "./tabs";

export type UserRow = typeof schema.users.$inferSelect;
export type SubmissionRow = typeof schema.submissions.$inferSelect;
export type ChallengeRow = typeof schema.challenges.$inferSelect;
export type CategoryRow = typeof schema.categories.$inferSelect;
export type CategoryStatRow = typeof schema.userCategoryStats.$inferSelect;

export type LeaderboardSubmission = Pick<
  SubmissionRow,
  "challengeId" | "createdAt" | "fixCorrect" | "totalScore"
> & {
  challenge?:
    | (Pick<ChallengeRow, "buggyArtifact" | "difficulty"> & {
        category?: Pick<CategoryRow, "name" | "slug"> | null;
      })
    | null;
};

export type UserWithSubmissions = (UserRow & {
  submissions: LeaderboardSubmission[];
})[];

export type UserWithCategoryStatsAndSubmissions = UserRow & {
  categoryStats: (CategoryStatRow & { category: CategoryRow | null })[];
  submissions: LeaderboardSubmission[];
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
  displayName: string | null;
  id: string;
  name: string | null;
  streakCount: number;
  submissions: LeaderboardSubmission[];
}

export interface GetLeaderboardOptions {
  categorySlug?: string | null;
  currentUserId?: string | null;
  limit?: number;
  period?: "weekly" | "all_time";
}

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
