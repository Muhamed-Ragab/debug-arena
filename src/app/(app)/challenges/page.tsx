import { ChallengeBrowser } from "@/features/browser/components/ChallengeBrowser";
import { getPublishedChallenges } from "@/features/challenge/queries";
import type { Category, Challenge, Difficulty } from "@/lib/domain/types";

export default async function ChallengesPage() {
  const dbChallenges = await getPublishedChallenges();

  const formattedChallenges: Challenge[] = dbChallenges.map((c) => {
    const artifact = c.buggyArtifact as {
      entryFile?: string;
      points?: number;
      timeLimit?: string;
    };
    const diff = (c.difficulty.charAt(0).toUpperCase() +
      c.difficulty.slice(1)) as Difficulty;

    const timeLimit = artifact.timeLimit ?? "25 min";

    return {
      category: c.categoryName as Category,
      difficulty: diff,
      filePath: artifact.entryFile ?? "main.ts",
      id: c.id,
      points: artifact.points ?? 200,
      solved: false,
      solves: 0,
      teaser: c.prompt.length > 120 ? `${c.prompt.slice(0, 120)}...` : c.prompt,
      time: `~${timeLimit}`,
      timeLimit,
      title: c.title,
    };
  });

  return <ChallengeBrowser initialChallenges={formattedChallenges} />;
}
