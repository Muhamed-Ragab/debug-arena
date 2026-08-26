"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { ActionError, authActionClient } from "@/lib/safe-action";
import { SEED_CHALLENGES } from "./data/challenges.seed";
import { gradeSubmission } from "./lib/grading";
import { type HiddenTestSpec, runSandboxTests } from "./lib/sandbox";

export const submitChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  hintsRevealedCount: z.number().int().min(0).default(0),
  localizationLine: z.number().int().positive().nullable(),
  proposedFixCode: z.string().optional(),
  rootCauseExplanation: z
    .string()
    .min(5, "Explanation must be at least 5 characters"),
  timeSpentSeconds: z.number().int().min(0).default(60),
});

export const submitChallengeAction = authActionClient
  .schema(submitChallengeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const {
      challengeId,
      localizationLine,
      rootCauseExplanation,
      proposedFixCode,
      hintsRevealedCount,
      timeSpentSeconds,
    } = parsedInput;

    const userId = ctx.user.id;

    // 1. Fetch challenge details with its canonical reference and tests
    const [challenge] = await db
      .select()
      .from(schema.challenges)
      .where(eq(schema.challenges.id, challengeId))
      .limit(1);

    if (!challenge) {
      throw new ActionError("Challenge not found");
    }

    // 2. Load hidden tests from seed catalog or challenge artifact
    const seedMatch = SEED_CHALLENGES.find(
      (c) =>
        c.title === challenge.title ||
        c.slug === challenge.title.toLowerCase().replace(/\s+/g, "-")
    );
    const hiddenTests: HiddenTestSpec[] = seedMatch?.hiddenTests ?? [];

    const buggyArtifact = challenge.buggyArtifact as {
      buggyLines?: [number, number];
      files?: Array<{ code: string; name: string }>;
    };
    const buggyLines: [number, number] = buggyArtifact.buggyLines ?? [1, 1];

    // 3. Run sandbox tests on the proposed fix (or reference fix)
    const codeToTest =
      proposedFixCode && proposedFixCode.trim().length > 0
        ? proposedFixCode
        : (buggyArtifact.files?.[0]?.code ?? "");

    const sandboxResult = await runSandboxTests(codeToTest, hiddenTests);

    // 4. Calculate hint penalty
    const hintsList = await db
      .select()
      .from(schema.hints)
      .where(eq(schema.hints.challengeId, challengeId));

    const totalHintPenalty = hintsList
      .slice(0, hintsRevealedCount)
      .reduce((sum, h) => sum + h.penaltyPoints, 0);

    // 5. Grade submission
    const grading = gradeSubmission({
      buggyLines,
      canonicalPreventionNotes: challenge.preventionNotes ?? "",
      canonicalRootCause: challenge.rootCauseSummary ?? "",
      hintsUsedCount: hintsRevealedCount,
      hintsUsedPenalty: totalHintPenalty,
      localizationLine,
      proposedFixCode: codeToTest,
      rootCauseExplanation,
      sandboxResult,
    });

    // 6. Save submission record
    const [submission] = await db
      .insert(schema.submissions)
      .values({
        challengeId,
        fixCorrect: grading.fixCorrect,
        hintsUsed: hintsRevealedCount,
        localizationAnswer: localizationLine
          ? `Line ${localizationLine}`
          : "None",
        localizationCorrect: grading.localizationCorrect,
        preventionAnswer: "Follow architectural safeguards & CI regression tests",
        preventionScore: grading.preventionScore,
        proposedFix: codeToTest,
        rootCauseExplanation,
        rootCauseScore: grading.rootCauseScore,
        timeSpentSeconds,
        totalScore: grading.totalScore,
        userId,
      })
      .returning();

    // 7. Update user_category_stats
    const { categoryId } = challenge;
    const existingStats = await db
      .select()
      .from(schema.userCategoryStats)
      .where(
        and(
          eq(schema.userCategoryStats.userId, userId),
          eq(schema.userCategoryStats.categoryId, categoryId)
        )
      )
      .limit(1);

    if (existingStats.length > 0) {
      const [prev] = existingStats;
      const newAttempts = prev.attempts + 1;
      const newAvgScore = Math.round(
        (prev.avgScore * prev.attempts + grading.totalScore) / newAttempts
      );
      const newAvgTime = Math.round(
        (prev.avgTimeSeconds * prev.attempts + timeSpentSeconds) / newAttempts
      );
      const newAccuracy = Math.round(
        (prev.rootCauseAccuracyPercent * prev.attempts +
          (grading.rootCauseScore / 25) * 100) /
          newAttempts
      );

      await db
        .update(schema.userCategoryStats)
        .set({
          attempts: newAttempts,
          avgScore: newAvgScore,
          avgTimeSeconds: newAvgTime,
          rootCauseAccuracyPercent: newAccuracy,
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
        avgScore: grading.totalScore,
        avgTimeSeconds: timeSpentSeconds,
        categoryId,
        rootCauseAccuracyPercent: Math.round(
          (grading.rootCauseScore / 25) * 100
        ),
        userId,
      });
    }

    return {
      aiFeedback: grading.aiFeedback,
      canonicalExplanation: grading.canonicalExplanation,
      preventionNotes: grading.preventionNotes,
      scoreParts: grading.scoreParts,
      submissionId: submission.id,
      totalScore: grading.totalScore,
    };
  });
