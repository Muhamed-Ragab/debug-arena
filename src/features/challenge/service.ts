import { revalidatePath } from "next/cache";
import { invalidateLeaderboardCache } from "@/features/leaderboard/cache";
import { leaderboardService } from "@/features/leaderboard/service";
import { profileRepository } from "@/features/profile/repository";
import { AI_PRIMARY_MODEL } from "@/lib/ai/constants";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import type { AIProviderType } from "@/lib/ai/types";
import { decryptApiKey } from "@/lib/crypto/encryption";
import { isSolved } from "@/lib/domain/scoring";
import { ActionError, NotFoundError } from "@/lib/safe-action";
import { DIFFICULTY_LABEL, STATUS_LABEL } from "./constants";
import {
  evaluateExplanationWithGroq,
  getEvaluatorStrategy,
} from "./lib/ai-evaluator";
import { gradeSubmission } from "./lib/grading";
import type { HiddenTestSpec } from "./lib/sandbox";
import { runSandboxTests } from "./lib/sandbox";
import { challengeRepository } from "./repository";
import type {
  ChallengeRepository,
  FindPublishedChallengesPaginatedOpts,
  SubmitChallengeInput,
} from "./types";
import type { ListChallengesQuery } from "./validation";

export { isSolved } from "@/lib/domain/scoring";

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

export async function resolveSubmissionAiConfig(userId: string): Promise<{
  apiKey: string | undefined;
  isByok: boolean;
  modelName: string;
  provider: AIProviderType;
}> {
  const aiSettings = await profileRepository.findAiSettingsByUserId(userId);
  let isByok = false;
  let provider: AIProviderType = "platform";
  let modelName: string = AI_PRIMARY_MODEL;
  let apiKey: string | undefined;

  if (aiSettings && aiSettings.activeProvider !== "platform") {
    const keyRow = await profileRepository.findApiKeyByProvider(
      userId,
      aiSettings.activeProvider
    );
    if (keyRow) {
      try {
        apiKey = decryptApiKey(keyRow.encryptedApiKey);
        provider = aiSettings.activeProvider as AIProviderType;
        modelName =
          aiSettings.customModel || aiSettings.activeModel || AI_PRIMARY_MODEL;
        isByok = true;
      } catch (err) {
        console.warn(
          "[submitChallenge] Failed to decrypt user key, falling back to platform default:",
          err
        );
      }
    }
  }

  return { apiKey, isByok, modelName, provider };
}

function resolveSubmissionArtifact(
  buggyArtifact: {
    buggyLines?: [number, number];
    files?: Array<{ code: string; name: string }>;
    hiddenTests?: HiddenTestSpec[];
  },
  proposedFixCode?: string
) {
  const hiddenTests: HiddenTestSpec[] = buggyArtifact.hiddenTests ?? [];
  const buggyLines: [number, number] = buggyArtifact.buggyLines ?? [1, 1];
  const codeToTest =
    proposedFixCode && proposedFixCode.trim().length > 0
      ? proposedFixCode
      : (buggyArtifact.files?.[0]?.code ?? "");
  return { buggyLines, codeToTest, hiddenTests };
}

function buildEvaluationDetails(
  aiEvaluation: {
    alignmentPercent: number;
    confidence?: string;
    modelUsed?: string;
  },
  grading: {
    enhancementSuggestions: string[];
    isAiGraded: boolean;
    isCorrect: boolean;
    keyConceptsIdentified: string[];
    missedMechanisms: string[];
    needsEnhancement: boolean;
  },
  fallbackModel: string
) {
  return {
    alignmentPercent: aiEvaluation.alignmentPercent,
    confidence: aiEvaluation.confidence ?? "high",
    enhancementSuggestions: grading.enhancementSuggestions,
    isAiGraded: grading.isAiGraded,
    isCorrect: grading.isCorrect,
    keyConceptsIdentified: grading.keyConceptsIdentified,
    missedMechanisms: grading.missedMechanisms,
    modelUsed: aiEvaluation.modelUsed || fallbackModel,
    needsEnhancement: grading.needsEnhancement,
  };
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

  async function getPublishedChallengesPaginated(
    opts: ListChallengesQuery
  ): Promise<{
    items: Awaited<ReturnType<typeof getPublishedChallenges>>;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }> {
    const paginatedOpts: FindPublishedChallengesPaginatedOpts = {
      category: opts.category,
      difficulty: opts.difficulty,
      page: opts.page,
      pageSize: opts.pageSize,
      search: opts.search,
    };
    const { rows, total } = await repo.findPublishedPaginated(paginatedOpts);
    const mapped = rows.map((c) => ({
      ...c,
      difficultyLabel: DIFFICULTY_LABEL[c.difficulty] ?? c.difficulty,
      statusLabel: STATUS_LABEL[c.status] ?? c.status,
    }));
    const totalPages = total === 0 ? 0 : Math.ceil(total / opts.pageSize);
    return {
      items: mapped,
      page: opts.page,
      pageSize: opts.pageSize,
      total,
      totalPages,
    };
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
      throw new NotFoundError("Challenge not found.");
    }

    const { apiKey, isByok, modelName, provider } =
      await resolveSubmissionAiConfig(input.userId);

    const rateLimit = await checkAIRateLimit(input.userId, isByok);
    if (!rateLimit.allowed) {
      throw new ActionError(
        rateLimit.errorReason ??
          "Rate limit exceeded. Please wait before submitting again."
      );
    }

    const { buggyLines, codeToTest, hiddenTests } = resolveSubmissionArtifact(
      challenge.buggyArtifact as {
        buggyLines?: [number, number];
        files?: Array<{ code: string; name: string }>;
        hiddenTests?: HiddenTestSpec[];
      },
      input.proposedFixCode
    );
    const sandboxResult = await deps.runSandbox(codeToTest, hiddenTests);
    const hintsList = await deps.challengeRepo.findHintsByChallengeId(
      input.challengeId
    );
    const totalHintPenalty = hintsList
      .slice(0, input.hintsRevealedCount)
      .reduce((sum, h) => sum + h.penaltyPoints, 0);

    const evaluateFn =
      deps.evaluate === evaluateExplanationWithGroq
        ? getEvaluatorStrategy({ apiKey, model: modelName, provider })
        : deps.evaluate;

    const aiEvaluation = await evaluateFn({
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
    const evaluationDetails = buildEvaluationDetails(
      aiEvaluation,
      grading,
      modelName
    );
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
    getPublishedChallengesPaginated,
    getSubmissionById,
    getUserChallengeStats,
    isSolved,
    submitChallenge,
  };
}

export const challengeService = createChallengeService(challengeRepository);
