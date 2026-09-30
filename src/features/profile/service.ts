import { leaderboardService } from "@/features/leaderboard/service";
import {
  calcPoints,
  countSolvedChallenges,
  getChallengeMaxPoints,
  getSubmissionPoints,
  isSolved,
  type ScoringSubmission,
} from "@/lib/domain/scoring";
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

export { calcPoints, isSolved } from "@/lib/domain/scoring";

type ChallengeSubmission = ScoringSubmission;

export function buildRadarData(
  input:
    | ChallengeSubmission[]
    | Map<
        string | undefined,
        { avgScore: number; rootCauseAccuracyPercent?: number | null }
      >
): RadarPoint[] {
  // Backwards-compatible: if Map, treat as statsMap (legacy)
  if (input instanceof Map) {
    const statsMap = input as Map<
      string | undefined,
      { avgScore: number; rootCauseAccuracyPercent?: number | null }
    >;
    return DEFAULT_CATEGORIES.map((catName) => {
      const cs = statsMap.get(catName);
      const score = cs ? cs.avgScore || cs.rootCauseAccuracyPercent || 0 : 0;
      return { fullMark: 100, score, subject: catName };
    });
  }
  const submissions = input as ChallengeSubmission[];
  return DEFAULT_CATEGORIES.map((catName) => {
    const catSubs = submissions.filter(
      (s) => s.challenge?.category?.name === catName
    );
    if (catSubs.length === 0) {
      return { fullMark: 100, score: 0, subject: catName };
    }
    const scored = catSubs.filter((s) => s.totalScore !== null);
    if (scored.length === 0) {
      return { fullMark: 100, score: 0, subject: catName };
    }
    const avg = Math.round(
      scored.reduce((acc, s) => acc + (s.totalScore ?? 0), 0) / scored.length
    );
    return { fullMark: 100, score: avg, subject: catName };
  });
}

export function buildRadarDataFromStatsMap(
  statsMap: Map<
    string | undefined,
    { avgScore: number; rootCauseAccuracyPercent?: number | null }
  >
): RadarPoint[] {
  return buildRadarData(statsMap);
}

export function buildCategoryStats(
  input: ChallengeSubmission[] | Map<string | undefined, { avgScore: number }>,
  maybeSubmissions?: ChallengeSubmission[]
): CategoryStat[] {
  // Legacy overload: (statsMap, submissions)
  if (input instanceof Map) {
    const statsMap = input as Map<string | undefined, { avgScore: number }>;
    const submissionsLegacy = (maybeSubmissions ?? []) as ChallengeSubmission[];
    return DEFAULT_CATEGORIES.map((catName) => {
      const cs = statsMap.get(catName);
      const catSolved = submissionsLegacy.filter(
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
  const submissions = input as ChallengeSubmission[];
  return DEFAULT_CATEGORIES.map((catName) => {
    const catSubs = submissions.filter(
      (s) => s.challenge?.category?.name === catName
    );
    const finalSolved = (() => {
      const hasChallengeId = catSubs.some((s) => Boolean(s.challengeId));
      if (hasChallengeId) {
        return new Set(catSubs.filter(isSolved).map((s) => s.challengeId)).size;
      }
      return catSubs.filter(isSolved).length;
    })();

    let score = 0;
    if (catSubs.length > 0) {
      const scored = catSubs.filter((s) => s.totalScore !== null);
      if (scored.length > 0) {
        const avg = Math.round(
          scored.reduce((acc, s) => acc + (s.totalScore ?? 0), 0) /
            scored.length
        );
        score = avg;
      }
    }
    return { category: catName, score, solved: finalSolved };
  });
}

export function buildStrengthData(
  submissions: ChallengeSubmission[]
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
      Hard: hardCount,
      Medium: medCount,
      name: catName,
    };
  });
}

function computeAvgScore(
  submissions: Array<{ totalScore: number | null }>
): number {
  if (submissions.length === 0) {
    return 0;
  }
  const sum = submissions.reduce((acc, s) => acc + (s.totalScore ?? 0), 0);
  return Math.round(sum / submissions.length);
}

function computeAvgTimeMinutes(
  submissions: Array<{ timeSpentSeconds: number | null }>
): number {
  if (submissions.length === 0) {
    return 0;
  }
  const total = submissions.reduce(
    (acc, s) => acc + (s.timeSpentSeconds ?? 0),
    0
  );
  return Math.round(total / submissions.length / 60);
}

function computeAvgHints(submissions: Array<{ hintsUsed: number }>): string {
  if (submissions.length === 0) {
    return "0";
  }
  const total = submissions.reduce((acc, s) => acc + s.hintsUsed, 0);
  return (total / submissions.length).toFixed(1);
}

function formatJoinedDate(
  createdAt: Date | string | null | undefined
): string | null {
  if (!createdAt) {
    return null;
  }
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatJoinedLabelLegacy(
  createdAt: Date | string | null | undefined
): string {
  const d = formatJoinedDate(createdAt);
  if (!d) {
    return "Member";
  }
  return `Member since ${d}`;
}

function resolveHandleDisplay(
  username: string | null | undefined,
  email: string | null | undefined
): string {
  if (username) {
    return `@${username}`;
  }
  if (email) {
    return `@${email.split("@")[0]}`;
  }
  return "@coder";
}

function resolveDisplayName(user: {
  displayName: string | null | undefined;
  name: string | null | undefined;
  username: string | null | undefined;
}): string {
  return user.displayName || user.name || user.username || "";
}

function buildRecentSubmissions(
  submissions: UserWithRelations["submissions"]
): (RecentSubmission & { id?: string; submittedAt?: string })[] {
  return submissions.map((submission) => {
    const submittedAt = submission.createdAt
      ? new Date(submission.createdAt).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        })
      : undefined;
    return {
      category: submission.challenge?.category?.name ?? "",
      id: submission.id,
      pts: getChallengeMaxPoints(submission.challenge),
      score: getSubmissionPoints(submission),
      submittedAt,
      title: submission.challenge?.title || "Challenge",
    };
  });
}

function buildProfileStatsValues(params: {
  avgHintsUsed: string;
  avgScore: number;
  avgTimeMinutes: number;
  solvedCount: number;
  totalPublishedCount: number;
  totalSubmissionsCount: number;
}) {
  const {
    avgHintsUsed,
    avgScore,
    avgTimeMinutes,
    solvedCount,
    totalPublishedCount,
    totalSubmissionsCount,
  } = params;
  return [
    {
      label: "Challenges Solved",
      value: `${solvedCount} / ${totalPublishedCount}`,
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
  ];
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
    const allSubmissions =
      typedUser.submissions as unknown as ChallengeSubmission[];
    const solvedCount = countSolvedChallenges(allSubmissions);
    const totalSubmissionsCount = allSubmissions.length;
    const avgScore = computeAvgScore(
      allSubmissions as Array<{ totalScore: number | null }>
    );
    const avgTimeMinutes = computeAvgTimeMinutes(
      allSubmissions as unknown as Array<{ timeSpentSeconds: number | null }>
    );
    const avgHintsUsed = computeAvgHints(
      allSubmissions as unknown as Array<{ hintsUsed: number }>
    );
    const joinedDate = formatJoinedDate(typedUser.createdAt);
    const joinedFormatted = formatJoinedLabelLegacy(typedUser.createdAt);
    const handleDisplay = resolveHandleDisplay(
      typedUser.username,
      typedUser.email
    );
    const totalPoints = calcPoints(allSubmissions);
    const liveRank = await leaderboardService.calculateUserRank(userId);
    const radarData = buildRadarData(allSubmissions);
    const categoryStats = buildCategoryStats(allSubmissions);
    const strengthData = buildStrengthData(allSubmissions);
    const recentSlice = [...typedUser.submissions]
      .sort(
        (a, b) =>
          new Date(b.createdAt as unknown as string).getTime() -
          new Date(a.createdAt as unknown as string).getTime()
      )
      .slice(0, 10);
    const recentSubmissions = buildRecentSubmissions(recentSlice);
    const displayName = resolveDisplayName(typedUser);
    const profileStats = buildProfileStatsValues({
      avgHintsUsed,
      avgScore,
      avgTimeMinutes,
      solvedCount,
      totalPublishedCount,
      totalSubmissionsCount,
    });
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
        joinedDate,
        name: displayName,
        points: totalPoints.toLocaleString("en-US"),
        rank: liveRank,
        streak: `${typedUser.streakCount}-day streak`,
        streakCount: typedUser.streakCount ?? 0,
      },
      profileStats,
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
        accountId: acc?.id,
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
