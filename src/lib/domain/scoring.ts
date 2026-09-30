export const CHALLENGE_POINTS_BY_DIFFICULTY = {
  easy: 100,
  hard: 300,
  medium: 200,
} as const;

export interface ScoringChallenge {
  buggyArtifact?: unknown;
  category?: { name?: string | null; slug?: string | null } | null;
  difficulty?: string | null;
  title?: string;
}

export interface ScoringSubmission {
  challenge?: ScoringChallenge | null;
  challengeId: string;
  createdAt?: Date | string;
  fixCorrect: boolean | null;
  totalScore: number | null;
}

export interface LeaderboardSubmissionFilter {
  categorySlug?: string | null;
  now?: Date;
  period?: "weekly" | "all_time";
}

export function isSolved(submission: {
  fixCorrect: boolean | null;
  totalScore: number | null;
}): boolean {
  return Boolean(submission.fixCorrect || (submission.totalScore ?? 0) >= 60);
}

export function getChallengeMaxPoints(
  challenge: ScoringChallenge | null | undefined
): number {
  const artifact = challenge?.buggyArtifact;
  if (artifact && typeof artifact === "object" && !Array.isArray(artifact)) {
    const configuredPoints = (artifact as Record<string, unknown>).points;
    if (
      typeof configuredPoints === "number" &&
      Number.isFinite(configuredPoints) &&
      configuredPoints > 0
    ) {
      return Math.max(1, Math.round(configuredPoints));
    }
  }

  const difficulty = challenge?.difficulty?.toLowerCase();
  if (difficulty === "medium" || difficulty === "hard") {
    return CHALLENGE_POINTS_BY_DIFFICULTY[difficulty];
  }
  return CHALLENGE_POINTS_BY_DIFFICULTY.easy;
}

export function getSubmissionPoints(submission: ScoringSubmission): number {
  const score = submission.totalScore;
  if (score === null || !Number.isFinite(score)) {
    return 0;
  }
  const normalizedScore = Math.min(100, Math.max(0, score));
  return Math.round(
    (getChallengeMaxPoints(submission.challenge) * normalizedScore) / 100
  );
}

export function calcPoints(submissions: readonly ScoringSubmission[]): number {
  const bestPointsByChallenge = new Map<string, number>();
  for (const submission of submissions) {
    if (!submission.challengeId) {
      continue;
    }
    const points = getSubmissionPoints(submission);
    const previousBest = bestPointsByChallenge.get(submission.challengeId) ?? 0;
    if (points > previousBest) {
      bestPointsByChallenge.set(submission.challengeId, points);
    }
  }
  return [...bestPointsByChallenge.values()].reduce(
    (total, points) => total + points,
    0
  );
}

export function countSolvedChallenges(
  submissions: readonly Pick<
    ScoringSubmission,
    "challengeId" | "fixCorrect" | "totalScore"
  >[]
): number {
  return new Set(
    submissions.filter(isSolved).map((submission) => submission.challengeId)
  ).size;
}

export function filterLeaderboardSubmissions<T extends ScoringSubmission>(
  submissions: readonly T[],
  {
    categorySlug,
    now = new Date(),
    period = "all_time",
  }: LeaderboardSubmissionFilter
): T[] {
  const weeklyCutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return submissions.filter((submission) => {
    if (categorySlug && submission.challenge?.category?.slug !== categorySlug) {
      return false;
    }
    if (period === "weekly") {
      const submittedAt = submission.createdAt
        ? new Date(submission.createdAt).getTime()
        : Number.NaN;
      return Number.isFinite(submittedAt) && submittedAt >= weeklyCutoff;
    }
    return true;
  });
}
