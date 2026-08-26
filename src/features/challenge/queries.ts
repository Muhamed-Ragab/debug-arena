import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

export async function getPublishedChallenges() {
  return await db
    .select({
      buggyArtifact: schema.challenges.buggyArtifact,
      categoryName: schema.categories.name,
      categorySlug: schema.categories.slug,
      createdAt: schema.challenges.createdAt,
      difficulty: schema.challenges.difficulty,
      format: schema.challenges.format,
      id: schema.challenges.id,
      prompt: schema.challenges.prompt,
      status: schema.challenges.status,
      title: schema.challenges.title,
    })
    .from(schema.challenges)
    .innerJoin(
      schema.categories,
      eq(schema.challenges.categoryId, schema.categories.id)
    )
    .where(eq(schema.challenges.status, "published"))
    .orderBy(desc(schema.challenges.createdAt));
}

export async function getChallengeById(challengeId: string) {
  const [challenge] = await db
    .select({
      buggyArtifact: schema.challenges.buggyArtifact,
      categoryId: schema.challenges.categoryId,
      categoryName: schema.categories.name,
      categorySlug: schema.categories.slug,
      createdAt: schema.challenges.createdAt,
      difficulty: schema.challenges.difficulty,
      format: schema.challenges.format,
      id: schema.challenges.id,
      preventionNotes: schema.challenges.preventionNotes,
      prompt: schema.challenges.prompt,
      referenceFix: schema.challenges.referenceFix,
      rootCauseSummary: schema.challenges.rootCauseSummary,
      status: schema.challenges.status,
      title: schema.challenges.title,
    })
    .from(schema.challenges)
    .innerJoin(
      schema.categories,
      eq(schema.challenges.categoryId, schema.categories.id)
    )
    .where(eq(schema.challenges.id, challengeId))
    .limit(1);

  if (!challenge) {
    return null;
  }

  const hintsList = await db
    .select()
    .from(schema.hints)
    .where(eq(schema.hints.challengeId, challengeId))
    .orderBy(asc(schema.hints.order));

  return {
    ...challenge,
    hints: hintsList,
  };
}

export async function getSubmissionById(submissionId: string) {
  const [submission] = await db
    .select({
      canonicalPreventionNotes: schema.challenges.preventionNotes,
      canonicalRootCause: schema.challenges.rootCauseSummary,
      categoryName: schema.categories.name,
      challengeDifficulty: schema.challenges.difficulty,
      challengeId: schema.submissions.challengeId,
      challengeTitle: schema.challenges.title,
      createdAt: schema.submissions.createdAt,
      fixCorrect: schema.submissions.fixCorrect,
      hintsUsed: schema.submissions.hintsUsed,
      id: schema.submissions.id,
      localizationAnswer: schema.submissions.localizationAnswer,
      localizationCorrect: schema.submissions.localizationCorrect,
      preventionAnswer: schema.submissions.preventionAnswer,
      preventionScore: schema.submissions.preventionScore,
      proposedFix: schema.submissions.proposedFix,
      referenceFix: schema.challenges.referenceFix,
      rootCauseExplanation: schema.submissions.rootCauseExplanation,
      rootCauseScore: schema.submissions.rootCauseScore,
      timeSpentSeconds: schema.submissions.timeSpentSeconds,
      totalScore: schema.submissions.totalScore,
      userId: schema.submissions.userId,
    })
    .from(schema.submissions)
    .innerJoin(
      schema.challenges,
      eq(schema.submissions.challengeId, schema.challenges.id)
    )
    .innerJoin(
      schema.categories,
      eq(schema.challenges.categoryId, schema.categories.id)
    )
    .where(eq(schema.submissions.id, submissionId))
    .limit(1);

  return submission ?? null;
}
