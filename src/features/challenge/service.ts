import { revalidatePath } from "next/cache";
import { invalidateLeaderboardCache } from "@/features/leaderboard/cache";
import { leaderboardService } from "@/features/leaderboard/service";
import { profileRepository } from "@/features/profile/repository";
import { NotFoundError } from "@/lib/safe-action";
import { DIFFICULTY_LABEL, STATUS_LABEL } from "./constants";
import { evaluateExplanationWithGroq } from "./lib/ai-evaluator";
import { gradeSubmission } from "./lib/grading";
import type { HiddenTestSpec } from "./lib/sandbox";
import { runSandboxTests } from "./lib/sandbox";
import { challengeRepository } from "./repository";
import type { ChallengeRepository, SubmitChallengeInput } from "./types";

export function isSolved(submission: {
  fixCorrect: boolean | null;
  totalScore: number | null;
}): boolean {
  return Boolean(submission.fixCorrect || (submission.totalScore ?? 0) >= 60);
}

export function calcRatingDelta(totalScore: number): number {
  return totalScore >= 70
    ? Math.round((totalScore - 60) / 4)
    : -Math.round((70 - totalScore) / 6);
}

export function formatLocalizationAnswer(lines: number[]): string {
  if (lines.length === 0) {
    return "None";
  }
  if (lines.length === 1) {
    return `Line ${lines[0]}`;
  }
  return `Lines ${lines.join(", ")}`;
}

export function createChallengeService(
  repo: ChallengeRepository = challengeRepository
) {
  async function getPublishedChallenges() {
    const list = await repo.findPublished();
    return list.map((c) => ({
      ...c,
      difficultyLabel: DIFFICULTY_LABEL[c.difficulty] ?? c.difficulty,
      statusLabel: STATUS_LABEL[c.status] ?? c.status,
    }));
  }

  async function getSubmissionById(id: string) {
    const submission = await repo.findSubmissionById(id);
    if (!submission) {
      return null;
    }
    const proposedFixObj =
      typeof submission.proposedFix === "object" &&
      submission.proposedFix !== null
        ? (submission.proposedFix as {
            aiEvaluation?: {
              alignmentPercent?: number;
              confidence?: string;
              enhancementSuggestions?: string[];
              isAiGraded?: boolean;
              isCorrect?: boolean;
              keyConceptsIdentified?: string[];
              missedMechanisms?: string[];
              modelUsed?: string;
              needsEnhancement?: boolean;
            };
            aiFeedback?: string;
            code?: string;
            score?: number;
            solution?: string;
          })
        : null;
    const aiFeedback =
      submission.aiFeedback || proposedFixObj?.aiFeedback || null;
    const evaluationDetails =
      (submission.evaluationDetails as {
        alignmentPercent?: number;
        confidence?: string;
        enhancementSuggestions?: string[];
        isAiGraded?: boolean;
        isCorrect?: boolean;
        keyConceptsIdentified?: string[];
        missedMechanisms?: string[];
        modelUsed?: string;
        needsEnhancement?: boolean;
      } | null) ||
      proposedFixObj?.aiEvaluation ||
      null;
    return {
      aiFeedback,
      canonicalPreventionNotes: submission.challenge.preventionNotes,
      canonicalRootCause: submission.challenge.rootCauseSummary,
      categoryName: submission.challenge.category.name,
      challengeDifficulty: submission.challenge.difficulty,
      challengeId: submission.challengeId,
      challengeTitle: submission.challenge.title,
      createdAt: submission.createdAt,
      evaluationDetails,
      fixCorrect: submission.fixCorrect,
      hintsUsed: submission.hintsUsed,
      id: submission.id,
      localizationAnswer: submission.localizationAnswer,
      localizationCorrect: submission.localizationCorrect,
      preventionAnswer: submission.preventionAnswer,
      preventionScore: submission.preventionScore,
      proposedFix: submission.proposedFix,
      referenceFix: submission.challenge.referenceFix,
      rootCauseExplanation: submission.rootCauseExplanation,
      rootCauseScore: submission.rootCauseScore,
      timeSpentSeconds: submission.timeSpentSeconds,
      totalScore: submission.totalScore,
      user: submission.user,
      userId: submission.userId,
    };
  }

  async function getChallengeById(id: string) {
    const c = await repo.findChallengeByIdForDetail(id);
    if (!c) {
      return null;
    }
    return {
      ...c,
      difficultyLabel: DIFFICULTY_LABEL[c.difficulty] ?? c.difficulty,
      statusLabel: STATUS_LABEL[c.status] ?? c.status,
    };
  }

  async function getUserChallengeStats(userId: string | null | undefined) {
    const data = await repo.findUserChallengeStatsData(userId ?? "");
    const totalCount = data.totalPublishedCount;
    if (!(userId && data.user)) {
      return {
        rank: "#--",
        solvedRatio: `0 / ${totalCount}`,
        streak: "0 days",
      };
    }
    const solvedIds = new Set(
      data.user.submissions.filter(isSolved).map((s) => s.challengeId)
    );
    const rank = await leaderboardService.calculateUserRank(userId);
    return {
      rank,
      solvedRatio: `${solvedIds.size} / ${totalCount}`,
      streak: `${data.user.streakCount} ${data.user.streakCount === 1 ? "day" : "days"}`,
    };
  }

  async function updateUserCategoryStats(
    userId: string,
    categoryId: string,
    totalScore: number,
    timeSpentSeconds: number,
    rootCauseScore: number
  ) {
    const existing = await profileRepository.findCategoryStats(
      userId,
      categoryId
    );
    if (existing) {
      const attempts = existing.attempts + 1;
      const avgScore = Math.round(
        (existing.avgScore * existing.attempts + totalScore) / attempts
      );
      const avgTime = Math.round(
        (existing.avgTimeSeconds * existing.attempts + timeSpentSeconds) /
          attempts
      );
      const rcAccuracy = Math.round(
        (existing.rootCauseAccuracyPercent * existing.attempts +
          (rootCauseScore / 25) * 100) /
          attempts
      );
      await profileRepository.upsertCategoryStats({
        attempts,
        avgScore,
        avgTimeSeconds: avgTime,
        categoryId,
        rootCauseAccuracyPercent: rcAccuracy,
        userId,
      });
    } else {
      await profileRepository.upsertCategoryStats({
        attempts: 1,
        avgScore: totalScore,
        avgTimeSeconds: timeSpentSeconds,
        categoryId,
        rootCauseAccuracyPercent: Math.round((rootCauseScore / 25) * 100),
        userId,
      });
    }
  }

  async function updateUserRatingAndStreak(userId: string, totalScore: number) {
    const data = await repo.findUserChallengeStatsData(userId);
    const { user } = data;
    if (!user) {
      return;
    }
    const ratingDelta = calcRatingDelta(totalScore);
    const newRating = Math.max(100, user.currentRating + ratingDelta);
    const now = new Date();
    const lastActive = user.lastActivityDate
      ? new Date(user.lastActivityDate)
      : null;
    let newStreak = user.streakCount;
    if (lastActive) {
      const diffDays = Math.floor(
        (now.setHours(0, 0, 0, 0) - lastActive.setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }
    await profileRepository.updateUser(userId, {
      currentRating: newRating,
      lastActivityDate: now,
      streakCount: newStreak,
    } as never);
  }

  async function submitChallenge(
    input: SubmitChallengeInput,
    deps = {
      challengeRepo: repo,
      evaluate: evaluateExplanationWithGroq,
      grade: gradeSubmission,
      runSandbox: runSandboxTests,
    }
  ) {
    const challenge = await deps.challengeRepo.findById(input.challengeId);
    if (!challenge) {
      throw new NotFoundError("Challenge not found");
    }
    const buggyArtifact = challenge.buggyArtifact as {
      buggyLines?: [number, number];
      files?: Array<{ code: string; name: string }>;
      hiddenTests?: HiddenTestSpec[];
    };
    const hiddenTests: HiddenTestSpec[] = buggyArtifact.hiddenTests ?? [];
    const buggyLines: [number, number] = buggyArtifact.buggyLines ?? [1, 1];
    const codeToTest =
      input.proposedFixCode && input.proposedFixCode.trim().length > 0
        ? input.proposedFixCode
        : (buggyArtifact.files?.[0]?.code ?? "");
    const sandboxResult = await deps.runSandbox(codeToTest, hiddenTests);
    const hintsList = await deps.challengeRepo.findHintsByChallengeId(
      input.challengeId
    );
    const totalHintPenalty = hintsList
      .slice(0, input.hintsRevealedCount)
      .reduce((sum, h) => sum + h.penaltyPoints, 0);
    const aiEvaluation = await deps.evaluate({
      buggyCodeSnippet: codeToTest,
      canonicalPreventionNotes: challenge.preventionNotes ?? "",
      canonicalRootCause: challenge.rootCauseSummary ?? "",
      challengeTitle: challenge.title,
      proposedFix: input.proposedFixCode,
      solutionExplanation: input.solutionExplanation,
      userExplanation: input.rootCauseExplanation,
    } as never);
    const grading = deps.grade({
      aiEvaluation,
      buggyLines,
      canonicalPreventionNotes: challenge.preventionNotes ?? "",
      canonicalRootCause: challenge.rootCauseSummary ?? "",
      hintsUsedCount: input.hintsRevealedCount,
      hintsUsedPenalty: totalHintPenalty,
      localizationLines: input.localizationLines,
      proposedFixCode: codeToTest,
      rootCauseExplanation: input.rootCauseExplanation,
      sandboxResult,
      solutionExplanation: input.solutionExplanation,
    } as never);
    const fixScore =
      grading.scoreParts[2]?.score ?? (grading.fixCorrect ? 25 : 0);
    const localizationAnswer = formatLocalizationAnswer(
      input.localizationLines
    );
    const evaluationDetails = {
      alignmentPercent: aiEvaluation.alignmentPercent,
      confidence: aiEvaluation.confidence ?? "high",
      enhancementSuggestions: grading.enhancementSuggestions,
      isAiGraded: grading.isAiGraded,
      isCorrect: grading.isCorrect,
      keyConceptsIdentified: grading.keyConceptsIdentified,
      missedMechanisms: grading.missedMechanisms,
      modelUsed: aiEvaluation.modelUsed,
      needsEnhancement: grading.needsEnhancement,
    };
    const submission = (await deps.challengeRepo.insertSubmission({
      aiFeedback: grading.aiFeedback,
      challengeId: input.challengeId,
      evaluationDetails,
      fixCorrect: grading.fixCorrect,
      hintsUsed: input.hintsRevealedCount,
      localizationAnswer,
      localizationCorrect: grading.localizationCorrect,
      preventionAnswer:
        aiEvaluation.preventionAnalysis ||
        "Follow architectural safeguards & CI regression tests",
      preventionScore: grading.preventionScore,
      proposedFix: {
        aiEvaluation: evaluationDetails,
        aiFeedback: grading.aiFeedback,
        code: input.proposedFixCode,
        score: fixScore,
        solution: input.solutionExplanation,
      },
      rootCauseExplanation: input.rootCauseExplanation,
      rootCauseScore: grading.rootCauseScore,
      timeSpentSeconds: input.timeSpentSeconds,
      totalScore: grading.totalScore,
      userId: input.userId,
    } as never)) as unknown as { id: string };
    await updateUserCategoryStats(
      input.userId,
      challenge.categoryId,
      grading.totalScore,
      input.timeSpentSeconds,
      grading.rootCauseScore
    );
    await updateUserRatingAndStreak(input.userId, grading.totalScore);
    await invalidateLeaderboardCache();
    try {
      revalidatePath("/challenges");
      revalidatePath("/leaderboard");
      revalidatePath("/profile");
    } catch {
      // ignore in non-request
    }
    return {
      aiFeedback: grading.aiFeedback,
      canonicalExplanation: grading.canonicalExplanation,
      enhancementSuggestions: grading.enhancementSuggestions,
      evaluationDetails,
      isAiGraded: grading.isAiGraded,
      isCorrect: grading.isCorrect,
      keyConceptsIdentified: grading.keyConceptsIdentified,
      missedMechanisms: grading.missedMechanisms,
      needsEnhancement: grading.needsEnhancement,
      preventionNotes: grading.preventionNotes,
      scoreParts: grading.scoreParts,
      submissionId: submission.id,
      totalScore: grading.totalScore,
    };
  }

  return {
    calcRatingDelta,
    formatLocalizationAnswer,
    getChallengeById,
    getPublishedChallenges,
    getSubmissionById,
    getUserChallengeStats,
    isSolved,
    submitChallenge,
  };
}

export const challengeService = createChallengeService(challengeRepository);
