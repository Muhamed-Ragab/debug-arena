import { leaderboardService } from "@/features/leaderboard/service";
import type { Category } from "@/lib/domain/types";
import { DEFAULT_CATEGORIES } from "./constants";
import { profileRepository } from "./repository";
import type {
  CategoryStat,
  ProfileRepository,
  RadarPoint,
  RecentSubmission,
  StrengthPoint,
  UserProfileData,
  UserSettingsData,
  UserWithRelations,
} from "./types";

export function isSolved(submission: {
  fixCorrect: boolean | null;
  totalScore: number | null;
}): boolean {
  return Boolean(submission.fixCorrect || (submission.totalScore ?? 0) >= 60);
}

export function calcPoints(currentRating: number, solvedCount: number): number {
  return currentRating * 10 + solvedCount * 50;
}

export function buildRadarData(
  statsMap: Map<
    string | undefined,
    { avgScore: number; rootCauseAccuracyPercent?: number | null }
  >
): RadarPoint[] {
  return DEFAULT_CATEGORIES.map((catName) => {
    const cs = statsMap.get(catName);
    const score = cs ? cs.avgScore || cs.rootCauseAccuracyPercent || 0 : 0;
    return { fullMark: 100, score, subject: catName };
  });
}

export function buildCategoryStats(
  statsMap: Map<string | undefined, { avgScore: number }>,
  submissions: Array<{
    challenge?: { category?: { name: string } | null } | null;
    fixCorrect: boolean | null;
    totalScore: number | null;
  }>
): CategoryStat[] {
  return DEFAULT_CATEGORIES.map((catName) => {
    const cs = statsMap.get(catName);
    const catSolved = submissions.filter(
      (s) => s.challenge?.category?.name === catName && isSolved(s)
    ).length;
    let score = 0;
    if (cs) {
      score = cs.avgScore;
    } else if (catSolved > 0) {
      score = 100;
    }
    return { category: catName, score, solved: catSolved };
  });
}

export function buildStrengthData(
  submissions: Array<{
    challenge?: {
      category?: { name: string } | null;
      difficulty?: string | null;
    } | null;
    fixCorrect: boolean | null;
    totalScore: number | null;
  }>
): StrengthPoint[] {
  return DEFAULT_CATEGORIES.map((catName) => {
    const catSubmissions = submissions.filter(
      (s) => s.challenge?.category?.name === catName && isSolved(s)
    );
    const easyCount = catSubmissions.filter(
      (s) => s.challenge?.difficulty === "easy"
    ).length;
    const medCount = catSubmissions.filter(
      (s) => s.challenge?.difficulty === "medium"
    ).length;
    const hardCount = catSubmissions.filter(
      (s) => s.challenge?.difficulty === "hard"
    ).length;
    return {
      Easy: easyCount,
      Expert: 0,
      Hard: hardCount,
      Medium: medCount,
      name: catName,
    };
  });
}

export function createProfileService(
  repo: ProfileRepository = profileRepository,
  profileRepo: ProfileRepository = profileRepository
) {
  async function getUserProfileData(
    userId: string
  ): Promise<UserProfileData | null> {
    const { user, publishedChallenges } =
      await repo.findByIdWithRelations(userId);
    if (!user) {
      return null;
    }
    const typedUser = user as UserWithRelations;
    const totalPublishedCount = publishedChallenges.length;
    const successfulSubmissions = typedUser.submissions.filter(isSolved);
    const solvedChallengeIds = new Set(
      successfulSubmissions.map((s) => s.challengeId)
    );
    const totalSubmissionsCount = typedUser.submissions.length;
    const avgScore =
      totalSubmissionsCount > 0
        ? Math.round(
            typedUser.submissions.reduce(
              (sum, s) => sum + (s.totalScore ?? 0),
              0
            ) / totalSubmissionsCount
          )
        : 0;
    const totalTimeSeconds = typedUser.submissions.reduce(
      (sum, s) => sum + (s.timeSpentSeconds ?? 0),
      0
    );
    const avgTimeMinutes =
      totalSubmissionsCount > 0
        ? Math.round(totalTimeSeconds / totalSubmissionsCount / 60)
        : 0;
    const totalHints = typedUser.submissions.reduce(
      (sum, s) => sum + s.hintsUsed,
      0
    );
    const avgHintsUsed =
      totalSubmissionsCount > 0
        ? (totalHints / totalSubmissionsCount).toFixed(1)
        : "0";
    const joinedFormatted = typedUser.createdAt
      ? `Member since ${new Date(typedUser.createdAt).toLocaleDateString(
          "en-US",
          {
            month: "short",
            year: "numeric",
          }
        )}`
      : "Member";
    let handleDisplay = "@coder";
    if (typedUser.username) {
      handleDisplay = `@${typedUser.username}`;
    } else if (typedUser.email) {
      handleDisplay = `@${typedUser.email.split("@")[0]}`;
    }
    const totalPoints = calcPoints(
      typedUser.currentRating,
      solvedChallengeIds.size
    );
    const liveRank = await leaderboardService.calculateUserRank(userId);
    const statsMap = new Map(
      typedUser.categoryStats.map((cs) => [cs.category?.name, cs])
    );
    const radarData = buildRadarData(
      statsMap as Map<
        string | undefined,
        { avgScore: number; rootCauseAccuracyPercent?: number | null }
      >
    );
    const categoryStats = buildCategoryStats(
      statsMap as Map<string | undefined, { avgScore: number }>,
      typedUser.submissions
    );
    const strengthData = buildStrengthData(typedUser.submissions);
    const recentSubmissions: (RecentSubmission & {
      id?: string;
      submittedAt?: string;
    })[] = typedUser.submissions.map((s) => ({
      category: (s.challenge?.category?.name as Category) || "State Mutations",
      id: s.id,
      pts:
        (s.challenge?.buggyArtifact as { points?: number } | null)?.points ??
        100,
      score: s.totalScore ?? 0,
      submittedAt: s.createdAt
        ? new Date(s.createdAt).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
          })
        : undefined,
      title: s.challenge?.title || "Challenge",
    }));
    const displayName =
      typedUser.displayName ||
      typedUser.name ||
      typedUser.username ||
      "Developer";
    return {
      categoryStats,
      profile: {
        avatarColor: typedUser.preferredColor || "#4f46e5",
        bio: typedUser.bio || "",
        displayName,
        handle: handleDisplay,
        image: typedUser.image || typedUser.avatarUrl,
        jobTitle: typedUser.jobTitle || "",
        joined: joinedFormatted,
        name: displayName,
        points: totalPoints.toLocaleString(),
        rank: liveRank,
        streak: `${typedUser.streakCount}-day streak`,
      },
      profileStats: [
        {
          label: "Challenges Solved",
          value: `${solvedChallengeIds.size} / ${totalPublishedCount}`,
        },
        {
          label: "Avg. Score",
          value: totalSubmissionsCount > 0 ? `${avgScore}` : "-",
        },
        {
          label: "Avg. Time to Fix",
          value: totalSubmissionsCount > 0 ? `${avgTimeMinutes}m` : "-",
        },
        {
          label: "Hints Used",
          value: totalSubmissionsCount > 0 ? `${avgHintsUsed}` : "0",
        },
      ],
      radarData,
      recentSubmissions,
      strengthData,
    };
  }

  async function getUserSettingsData(
    userId: string
  ): Promise<UserSettingsData | null> {
    const user = await profileRepo.findByIdForSettings(userId);
    if (!user) {
      return null;
    }
    const supportedProviders = [
      { label: "GitHub", provider: "github" as const },
      { label: "Google", provider: "google" as const },
      { label: "GitLab", provider: "gitlab" as const },
      { label: "Discord", provider: "discord" as const },
    ];
    const userAccountsMap = new Map(
      user.accounts.map((a) => [a.providerId, a])
    );
    const accounts = supportedProviders.map((p) => {
      const acc = userAccountsMap.get(p.provider);
      return {
        connected: Boolean(acc),
        email: acc?.accountId || (acc ? user.email : undefined),
        isCurrentSignIn: Boolean(acc),
        isPrimary:
          p.provider === "github" ||
          (Boolean(acc) && user.accounts.length === 1),
        label: p.label,
        provider: p.provider,
      };
    });
    const sessions = [
      {
        browser: "Chrome",
        current: true,
        device: "Current Session",
        deviceType: "desktop" as const,
        id: "current_session",
        ip: user.loginAttempts[0]?.ipAddress || "127.0.0.1",
        lastActive: "Active now",
        location: "Local Network",
        os: "Desktop OS",
      },
    ];
    return {
      accounts,
      profile: {
        avatarColor: user.preferredColor || "#4f46e5",
        avatarUrl: user.avatarUrl || user.image || "",
        bio: user.bio || "",
        displayName: user.displayName || user.name || "",
        handle: user.username || user.email.split("@")[0] || "",
        interests: (user.interests as string[]) || [],
        isPublic: user.isPublic ?? true,
        jobTitle: user.jobTitle || "",
      },
      sessions,
    };
  }

  return {
    buildCategoryStats,
    buildRadarData,
    buildStrengthData,
    calcPoints,
    getUserProfileData,
    getUserSettingsData,
    isSolved,
  };
}

export const profileService = createProfileService(
  profileRepository,
  profileRepository
);
