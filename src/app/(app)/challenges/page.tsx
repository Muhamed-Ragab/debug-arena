import { ChallengeBrowser } from "@/features/browser/components/ChallengeBrowser";
import {
  getPublishedChallenges,
  getUserChallengeStats,
} from "@/features/challenge/queries";
import { getServerSession } from "@/lib/auth/session";
import type { Category, Challenge, Difficulty } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const session = await getServerSession();
  const userId = session?.user?.id;

  const [dbChallenges, userStats] = await Promise.all([
    getPublishedChallenges(),
    getUserChallengeStats(userId),
  ]);

  const formattedChallenges: Challenge[] = dbChallenges.map((c) => {
    const artifact = c.buggyArtifact as {
      entryFile?: string;
      points?: number;
      timeLimit?: string;
    };
    const diff = (c.difficulty.charAt(0).toUpperCase() +
      c.difficulty.slice(1)) as Difficulty;

    const timeLimit = artifact.timeLimit ?? "25 min";

    const successfulSubmissions = c.submissions.filter(
      (s) => s.fixCorrect || (s.totalScore ?? 0) >= 60
    );
    const userSolved = userId
      ? successfulSubmissions.some((s) => s.userId === userId)
      : false;

    return {
      category: c.categoryName as Category,
      difficulty: diff,
      filePath: artifact.entryFile ?? "main.ts",
      id: c.id,
      points: artifact.points ?? 200,
      solved: userSolved,
      solves: successfulSubmissions.length,
      teaser: c.prompt.length > 120 ? `${c.prompt.slice(0, 120)}...` : c.prompt,
      time: `~${timeLimit}`,
      timeLimit,
      title: c.title,
    };
  });

  const statsProps = [
    { label: "Solved", value: userStats.solvedRatio },
    { label: "Current Streak", value: userStats.streak },
    { label: "Rank", value: userStats.rank },
  ];

  return (
    <ChallengeBrowser
      initialChallenges={formattedChallenges}
      stats={statsProps}
    />
  );
}
