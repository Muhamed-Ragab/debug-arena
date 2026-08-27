import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

export async function getAdminCategories() {
  return await db.query.categories.findMany({
    orderBy: [asc(schema.categories.name)],
  });
}

export async function getAdminChallenges() {
  const challengesList = await db.query.challenges.findMany({
    orderBy: [desc(schema.challenges.createdAt)],
    with: {
      category: true,
      hints: {
        orderBy: [asc(schema.hints.order)],
      },
      submissions: {
        columns: {
          fixCorrect: true,
          id: true,
          totalScore: true,
        },
      },
    },
  });

  return challengesList.map((c) => ({
    buggyArtifact: c.buggyArtifact,
    categoryId: c.categoryId,
    categoryName: c.category.name,
    categorySlug: c.category.slug,
    createdAt: c.createdAt,
    difficulty: c.difficulty,
    format: c.format,
    hints: c.hints,
    id: c.id,
    preventionNotes: c.preventionNotes,
    prompt: c.prompt,
    referenceFix: c.referenceFix,
    rootCauseSummary: c.rootCauseSummary,
    solvesCount: c.submissions.filter(
      (s) => s.fixCorrect || (s.totalScore ?? 0) >= 60
    ).length,
    source: c.source,
    status: c.status,
    submissionsCount: c.submissions.length,
    title: c.title,
  }));
}

export async function getAdminChallengeById(challengeId: string) {
  const challenge = await db.query.challenges.findFirst({
    where: eq(schema.challenges.id, challengeId),
    with: {
      category: true,
      hints: {
        orderBy: [asc(schema.hints.order)],
      },
      submissions: true,
    },
  });

  return challenge;
}
