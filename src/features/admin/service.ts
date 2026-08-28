import { generateDeterministicEmbedding } from "@/features/challenge/lib/embedding";
import { adminRepository } from "./repository";
import type { SaveChallengeInput } from "./types";

export async function generateQuestionDraft(params: unknown) {
  const mod = await import("./lib/question-generator-agent");
  return mod.generateQuestionDraft(params as never);
}

export async function refineQuestionDraft(params: unknown) {
  const mod = await import("./lib/question-generator-agent");
  return mod.refineQuestionDraft(params as never);
}

export async function saveChallenge(
  input: SaveChallengeInput,
  repo = adminRepository
) {
  const category = await repo
    .findCategories()
    .then((cats) => cats.find((c) => c.slug === input.categorySlug));
  if (!category) {
    throw new Error(`Unknown category slug: ${input.categorySlug}`);
  }
  const embedding = generateDeterministicEmbedding(input.rootCauseSummary);
  let challengeId = input.id ?? null;
  if (challengeId) {
    await repo.updateChallenge(challengeId, {
      buggyArtifact: input.buggyArtifact as never,
      categoryId: category.id,
      difficulty: input.difficulty as never,
      format: (input.format as never) ?? "code_snippet",
      preventionNotes: input.preventionNotes ?? null,
      prompt: input.prompt,
      referenceFix: input.referenceFix as never,
      rootCauseSummary: input.rootCauseSummary,
      source: (input.source as never) ?? "manual",
      status: input.status as never,
      title: input.title,
    });
    await repo.deleteHintsByChallengeId(challengeId);
  } else {
    const inserted = await repo.insertChallenge({
      buggyArtifact: input.buggyArtifact as never,
      categoryId: category.id,
      difficulty: input.difficulty as never,
      format: (input.format as never) ?? "code_snippet",
      preventionNotes: input.preventionNotes ?? null,
      prompt: input.prompt,
      referenceFix: input.referenceFix as never,
      rootCauseSummary: input.rootCauseSummary,
      source: (input.source as never) ?? "manual",
      status: input.status as never,
      title: input.title,
    });
    challengeId = inserted.id;
  }
  if (input.hints.length > 0 && challengeId) {
    await repo.insertHints(
      input.hints.map((hint, idx) => ({
        challengeId: challengeId as string,
        order: hint.order ?? idx + 1,
        penaltyPoints: hint.penaltyPoints ?? 10,
        socraticPrompt: hint.socraticPrompt,
      }))
    );
  }
  if (challengeId) {
    await repo.upsertEmbedding(
      challengeId,
      `${input.title} ${input.rootCauseSummary} ${input.prompt}`,
      embedding as never
    );
  }
  return { challengeId, status: input.status, success: true };
}

export async function toggleStatus(
  challengeId: string,
  status: string,
  repo = adminRepository
) {
  await repo.updateChallenge(challengeId, { status: status as never });
  return { challengeId, status, success: true };
}

export async function deleteChallengeCascade(
  challengeId: string,
  repo = adminRepository
) {
  await repo.deleteChallengeCascade(challengeId);
  return { challengeId, success: true };
}

export async function getAdminCategories(repo = adminRepository) {
  return await repo.findCategories();
}

export async function getAdminChallenges(repo = adminRepository) {
  const raw = await repo.findChallenges();
  return raw.map((c) => ({
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

export async function getAdminChallengeById(
  challengeId: string,
  repo = adminRepository
) {
  return await repo.findChallengeById(challengeId);
}
