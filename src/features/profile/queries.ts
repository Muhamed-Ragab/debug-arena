import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { calculateUserRank } from "@/features/leaderboard/queries";
import type { Category } from "@/lib/domain/types";
import type {
  CategoryStat,
  ProfileStat,
  RadarPoint,
  RecentSubmission,
} from "./data/profile";
import type { LinkedAccount, SessionData } from "./data/settings";
import type { StrengthPoint } from "./types";

export interface UserProfileData {
  categoryStats: CategoryStat[];
  profile: {
    avatarColor?: string;
    bio: string;
    displayName: string;
    handle: string;
    image?: string | null;
    jobTitle?: string;
    joined: string;
    name: string;
    points: string;
    rank: string;
    streak: string;
  };
  profileStats: ProfileStat[];
  radarData: RadarPoint[];
  recentSubmissions: (RecentSubmission & {
    id?: string;
    submittedAt?: string;
  })[];
  strengthData: StrengthPoint[];
}

export interface UserSettingsData {
  accounts: LinkedAccount[];
  profile: {
    avatarColor?: string;
    avatarUrl?: string;
    bio?: string;
    displayName?: string;
    handle?: string;
    interests?: string[];
    isPublic?: boolean;
    jobTitle?: string;
  };
  sessions: SessionData[];
}

const DEFAULT_CATEGORIES: Category[] = [
  "State Mutations",
  "Race Conditions",
  "Security Flaws",
  "Memory Leaks",
];

export async function getUserProfileData(
  userId: string
): Promise<UserProfileData | null> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    with: {
      accounts: true,
      categoryStats: {
        with: {
          category: true,
        },
      },
      profileLinks: true,
      submissions: {
        limit: 10,
        orderBy: [desc(schema.submissions.createdAt)],
        with: {
          challenge: {
            with: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const publishedChallenges = await db.query.challenges.findMany({
    where: eq(schema.challenges.status, "published"),
    with: {
      category: true,
    },
  });

  const totalPublishedCount = publishedChallenges.length;

  // Compute solves & stats
  const successfulSubmissions = user.submissions.filter(
    (s) => s.fixCorrect || (s.totalScore ?? 0) >= 60
  );
  const solvedChallengeIds = new Set(
    successfulSubmissions.map((s) => s.challengeId)
  );

  const totalSubmissionsCount = user.submissions.length;
  const avgScore =
    totalSubmissionsCount > 0
      ? Math.round(
          user.submissions.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) /
            totalSubmissionsCount
        )
      : 0;

  const totalTimeSeconds = user.submissions.reduce(
    (sum, s) => sum + (s.timeSpentSeconds ?? 0),
    0
  );
  const avgTimeMinutes =
    totalSubmissionsCount > 0
      ? Math.round(totalTimeSeconds / totalSubmissionsCount / 60)
      : 0;

  const totalHints = user.submissions.reduce((sum, s) => sum + s.hintsUsed, 0);
  const avgHintsUsed =
    totalSubmissionsCount > 0
      ? (totalHints / totalSubmissionsCount).toFixed(1)
      : "0";

  const joinedFormatted = user.createdAt
    ? `Member since ${new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })}`
    : "Member";

  let handleDisplay = "@coder";
  if (user.username) {
    handleDisplay = `@${user.username}`;
  } else if (user.email) {
    handleDisplay = `@${user.email.split("@")[0]}`;
  }

  const totalPoints = user.currentRating * 10 + solvedChallengeIds.size * 50;
  const liveRank = await calculateUserRank(userId);

  // Radar and Category stats
  const statsMap = new Map(
    user.categoryStats.map((cs) => [cs.category?.name, cs])
  );

  const radarData: RadarPoint[] = DEFAULT_CATEGORIES.map((catName) => {
    const cs = statsMap.get(catName);
    const score = cs ? cs.avgScore || cs.rootCauseAccuracyPercent || 0 : 0;
    return {
      fullMark: 100,
      score,
      subject: catName,
    };
  });

  const categoryStats: CategoryStat[] = DEFAULT_CATEGORIES.map((catName) => {
    const cs = statsMap.get(catName);
    const catSolved = user.submissions.filter(
      (s) =>
        s.challenge?.category?.name === catName &&
        (s.fixCorrect || (s.totalScore ?? 0) >= 60)
    ).length;

    let score = 0;
    if (cs) {
      score = cs.avgScore;
    } else if (catSolved > 0) {
      score = 100;
    }

    return {
      category: catName,
      score,
      solved: catSolved,
    };
  });

  // Strength breakdown by difficulty
  const strengthData: StrengthPoint[] = DEFAULT_CATEGORIES.map((catName) => {
    const catSubmissions = user.submissions.filter(
      (s) =>
        s.challenge?.category?.name === catName &&
        (s.fixCorrect || (s.totalScore ?? 0) >= 60)
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

  // Recent Submissions
  const recentSubmissions: (RecentSubmission & {
    id?: string;
    submittedAt?: string;
  })[] = user.submissions.map((s) => ({
    category: (s.challenge?.category?.name as Category) || "State Mutations",
    id: s.id,
    pts:
      (s.challenge?.buggyArtifact as { points?: number } | null)?.points ?? 100,
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
    user.displayName || user.name || user.username || "Developer";

  return {
    categoryStats,
    profile: {
      avatarColor: user.preferredColor || "#4f46e5",
      bio: user.bio || "",
      displayName,
      handle: handleDisplay,
      image: user.image || user.avatarUrl,
      jobTitle: user.jobTitle || "",
      joined: joinedFormatted,
      name: displayName,
      points: totalPoints.toLocaleString(),
      rank: liveRank,
      streak: `${user.streakCount}-day streak`,
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

export async function getUserSettingsData(
  userId: string
): Promise<UserSettingsData | null> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    with: {
      accounts: true,
      loginAttempts: {
        limit: 5,
        orderBy: [desc(schema.loginAttempts.attemptedAt)],
      },
    },
  });

  if (!user) {
    return null;
  }

  // Linked accounts
  const supportedProviders = [
    { label: "GitHub", provider: "github" as const },
    { label: "Google", provider: "google" as const },
    { label: "GitLab", provider: "gitlab" as const },
    { label: "Discord", provider: "discord" as const },
  ];

  const userAccountsMap = new Map(user.accounts.map((a) => [a.providerId, a]));

  const accounts: LinkedAccount[] = supportedProviders.map((p) => {
    const acc = userAccountsMap.get(p.provider);
    return {
      connected: Boolean(acc),
      email: acc?.accountId || (acc ? user.email : undefined),
      isCurrentSignIn: Boolean(acc),
      isPrimary:
        p.provider === "github" || (Boolean(acc) && user.accounts.length === 1),
      label: p.label,
      provider: p.provider,
    };
  });

  // Active Sessions
  const sessions: SessionData[] = [
    {
      browser: "Chrome",
      current: true,
      device: "Current Session",
      deviceType: "desktop",
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
