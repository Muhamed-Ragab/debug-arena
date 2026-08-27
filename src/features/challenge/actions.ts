"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { invalidateLeaderboardCache } from "@/features/leaderboard/cache";
import { ActionError, authActionClient } from "@/lib/safe-action";
import { evaluateExplanationWithGroq } from "./lib/ai-evaluator";
import { gradeSubmission } from "./lib/grading";
import { type HiddenTestSpec, runSandboxTests } from "./lib/sandbox";
import { submitChallengeSchema } from "./validations";

async function updateUserCategoryStats(
  userId: string,
  categoryId: string,
  totalScore: number,
  timeSpentSeconds: number,
  rootCauseScore: number
) {
  const existingStats = await db.query.userCategoryStats.findFirst({
    where: and(
      eq(schema.userCategoryStats.userId, userId),
      eq(schema.userCategoryStats.categoryId, categoryId)
    ),
  });

  if (existingStats) {
    const attempts = existingStats.attempts + 1;
    const avgScore = Math.round(
      (existingStats.avgScore * existingStats.attempts + totalScore) / attempts
    );
    const avgTime = Math.round(
      (existingStats.avgTimeSeconds * existingStats.attempts +
        timeSpentSeconds) /
        attempts
    );
    const rcAccuracy = Math.round(
      (existingStats.rootCauseAccuracyPercent * existingStats.attempts +
        (rootCauseScore / 25) * 100) /
        attempts
    );

    await db
      .update(schema.userCategoryStats)
      .set({
        attempts,
        avgScore,
        avgTimeSeconds: avgTime,
        rootCauseAccuracyPercent: rcAccuracy,
      })
      .where(
        and(
          eq(schema.userCategoryStats.userId, userId),
          eq(schema.userCategoryStats.categoryId, categoryId)
        )
      );
  } else {
    await db.insert(schema.userCategoryStats).values({
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
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });

  if (!user) {
    return;
  }

  const ratingDelta =
    totalScore >= 70
      ? Math.round((totalScore - 60) / 4)
      : -Math.round((70 - totalScore) / 6);
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

  await db
    .update(schema.users)
    .set({
      currentRating: newRating,
      lastActivityDate: new Date(),
      streakCount: newStreak,
    })
    .where(eq(schema.users.id, userId));
}

function formatLocalizationAnswer(lines: number[]): string {
  if (lines.length === 0) {
    return "None";
  }
  if (lines.length === 1) {
    return `Line ${lines[0]}`;
  }
  return `Lines ${lines.join(", ")}`;
}

export const submitChallengeAction = authActionClient
  .inputSchema(submitChallengeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const {
      challengeId,
      localizationLines,
      rootCauseExplanation,
      solutionExplanation,
      proposedFixCode,
      hintsRevealedCount,
      timeSpentSeconds,
    } = parsedInput;

    const userId = ctx.user.id;

    // 1. Fetch challenge details
    const challenge = await db.query.challenges.findFirst({
      where: eq(schema.challenges.id, challengeId),
    });

    if (!challenge) {
      throw new ActionError("Challenge not found");
    }

    // 2. Load hidden tests
    const buggyArtifact = challenge.buggyArtifact as {
      buggyLines?: [number, number];
      files?: Array<{ code: string; name: string }>;
      hiddenTests?: HiddenTestSpec[];
    };
    const hiddenTests: HiddenTestSpec[] = buggyArtifact.hiddenTests ?? [];
    const buggyLines: [number, number] = buggyArtifact.buggyLines ?? [1, 1];

    // 3. Run sandbox tests
    const codeToTest =
      proposedFixCode && proposedFixCode.trim().length > 0
        ? proposedFixCode
        : (buggyArtifact.files?.[0]?.code ?? "");

    const sandboxResult = await runSandboxTests(codeToTest, hiddenTests);

    // 4. Calculate hint penalty
    const hintsList = await db.query.hints.findMany({
      where: eq(schema.hints.challengeId, challengeId),
    });

    const totalHintPenalty = hintsList
      .slice(0, hintsRevealedCount)
      .reduce((sum, h) => sum + h.penaltyPoints, 0);

    // 5. Evaluate explanation using Groq LLM
    const aiEvaluation = await evaluateExplanationWithGroq({
      buggyCodeSnippet: codeToTest,
      canonicalPreventionNotes: challenge.preventionNotes ?? "",
      canonicalRootCause: challenge.rootCauseSummary ?? "",
      challengeTitle: challenge.title,
      proposedFix: proposedFixCode,
      solutionExplanation,
      userExplanation: rootCauseExplanation,
    });

    // 6. Grade submission
    const activeLines = localizationLines ?? [];

    const grading = gradeSubmission({
      aiEvaluation,
      buggyLines,
      canonicalPreventionNotes: challenge.preventionNotes ?? "",
      canonicalRootCause: challenge.rootCauseSummary ?? "",
      hintsUsedCount: hintsRevealedCount,
      hintsUsedPenalty: totalHintPenalty,
      localizationLines: activeLines,
      proposedFixCode: codeToTest,
      rootCauseExplanation,
      sandboxResult,
      solutionExplanation,
    });

    const fixScore =
      grading.scoreParts[2]?.score ?? (grading.fixCorrect ? 25 : 0);

    const localizationAnswer = formatLocalizationAnswer(activeLines);

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

    // 7. Save submission record
    const [submission] = await db
      .insert(schema.submissions)
      .values({
        aiFeedback: grading.aiFeedback,
        challengeId,
        evaluationDetails,
        fixCorrect: grading.fixCorrect,
        hintsUsed: hintsRevealedCount,
        localizationAnswer,
        localizationCorrect: grading.localizationCorrect,
        preventionAnswer:
          aiEvaluation.preventionAnalysis ||
          "Follow architectural safeguards & CI regression tests",
        preventionScore: grading.preventionScore,
        proposedFix: {
          aiEvaluation: evaluationDetails,
          aiFeedback: grading.aiFeedback,
          code: proposedFixCode,
          score: fixScore,
          solution: solutionExplanation,
        },
        rootCauseExplanation,
        rootCauseScore: grading.rootCauseScore,
        timeSpentSeconds,
        totalScore: grading.totalScore,
        userId,
      })
      .returning();

    // 8. Update user category stats & rating
    await updateUserCategoryStats(
      userId,
      challenge.categoryId,
      grading.totalScore,
      timeSpentSeconds,
      grading.rootCauseScore
    );

    await updateUserRatingAndStreak(userId, grading.totalScore);

    // 9. Invalidate leaderboard Redis cache and revalidate pages
    await invalidateLeaderboardCache();
    try {
      revalidatePath("/challenges");
      revalidatePath("/leaderboard");
      revalidatePath("/profile");
    } catch {
      // Ignored in non-request contexts
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
  });
