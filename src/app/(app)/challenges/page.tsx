import { OfflineBanner } from "@/components/shared/offline-banner";
import { ChallengeBrowser } from "@/features/browser/components/ChallengeBrowser";
import { challengeService } from "@/features/challenge/service";
import { getServerSession } from "@/lib/auth/session";
import type { Category, Challenge, Difficulty } from "@/lib/domain/types";
import { isOfflineCause, isOfflineError, OFFLINE_MESSAGE } from "@/lib/offline";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const session = await getServerSession();
  const userId = session?.user?.id;

  let dbChallenges: Awaited<
    ReturnType<typeof challengeService.getPublishedChallenges>
  >;
  let userStats: Awaited<
    ReturnType<typeof challengeService.getUserChallengeStats>
  >;

  try {
    [dbChallenges, userStats] = await Promise.all([
      challengeService.getPublishedChallenges(),
      challengeService.getUserChallengeStats(userId),
    ]);
  } catch (err) {
    console.error("[ChallengesPage] Failed to load:", err);
    const offline = isOfflineError(err) || isOfflineCause(err);
    const variant = offline ? "offline" : "generic";
    const message = offline ? OFFLINE_MESSAGE : "Something went wrong";
    return (
      <div className="flex h-full flex-col">
        <div className="px-4 py-4 sm:px-8">
          <OfflineBanner message={message} variant={variant} />
        </div>
        <ChallengeBrowser
          initialChallenges={[]}
          stats={[
            { label: "browser.stats.solved", value: "0 / 0" },
            { label: "browser.stats.currentStreak", value: "0 days" },
            { label: "browser.stats.rank", value: "#--" },
          ]}
        />
      </div>
    );
  }

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
    { label: "browser.stats.solved", value: userStats.solvedRatio },
    { label: "browser.stats.currentStreak", value: userStats.streak },
    { label: "browser.stats.rank", value: userStats.rank },
  ];

  return (
    <ChallengeBrowser
      initialChallenges={formattedChallenges}
      stats={statsProps}
    />
  );
}
