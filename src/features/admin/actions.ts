"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { generateDeterministicEmbedding } from "@/features/challenge/lib/embedding";
import { ActionError, adminActionClient } from "@/lib/safe-action";
import {
  type GeneratedChallengeDraft,
  generateQuestionDraft,
  refineQuestionDraft,
} from "./lib/question-generator-agent";

const generateQuestionSchema = z.object({
  additionalInstructions: z.string().optional(),
  bugPattern: z.string().optional(),
  categoryName: z.string().optional(),
  categorySlug: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  format: z
    .enum(["code_snippet", "log_only", "ui_recording"])
    .default("code_snippet"),
  language: z.string().optional(),
  topic: z.string().optional(),
});

const challengeFileSchema = z.object({
  code: z.string(),
  isEntry: z.boolean().optional(),
  name: z.string(),
});

const diffLineSchema = z.object({
  line: z.number().optional(),
  text: z.string(),
  type: z.enum(["ctx", "add", "del"]),
});

const generatedDraftSchema = z.object({
  buggyArtifact: z.object({
    buggyLines: z.tuple([z.number(), z.number()]),
    entryFile: z.string(),
    files: z.array(challengeFileSchema),
    language: z.string(),
    points: z.number(),
    timeLimit: z.string(),
  }),
  categorySlug: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  format: z.enum(["code_snippet", "log_only", "ui_recording"]),
  hiddenTests: z
    .array(
      z.object({
        description: z.string(),
        name: z.string(),
        testCode: z.string(),
      })
    )
    .optional(),
  hints: z.array(
    z.object({
      order: z.number(),
      penaltyPoints: z.number(),
      socraticPrompt: z.string(),
    })
  ),
  preventionNotes: z.string(),
  prompt: z.string(),
  referenceFix: z.object({
    diff: z.array(diffLineSchema),
    explanation: z.string(),
    files: z.array(challengeFileSchema),
  }),
  rootCauseSummary: z.string(),
  title: z.string(),
});

const refineQuestionSchema = z.object({
  currentDraft: generatedDraftSchema,
  instruction: z.string().min(1, "Instruction is required"),
});

const saveChallengeSchema = z.object({
  buggyArtifact: z.object({
    buggyLines: z.tuple([z.number(), z.number()]),
    entryFile: z.string(),
    files: z.array(challengeFileSchema),
    language: z.string(),
    points: z.number(),
    timeLimit: z.string(),
  }),
  categorySlug: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  format: z
    .enum(["code_snippet", "log_only", "ui_recording"])
    .default("code_snippet"),
  hiddenTests: z
    .array(
      z.object({
        description: z.string(),
        name: z.string(),
        testCode: z.string(),
      })
    )
    .optional(),
  hints: z.array(
    z.object({
      order: z.number(),
      penaltyPoints: z.number(),
      socraticPrompt: z.string(),
    })
  ),
  id: z.string().uuid().optional(),
  preventionNotes: z.string().optional(),
  prompt: z.string().min(5, "Prompt must have descriptive content"),
  referenceFix: z.object({
    diff: z.array(diffLineSchema),
    explanation: z.string(),
    files: z.array(challengeFileSchema),
  }),
  rootCauseSummary: z.string().min(5, "Root cause explanation is required"),
  source: z
    .enum(["manual", "ai_generated", "postmortem_import"])
    .default("ai_generated"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  title: z.string().min(3, "Title must be at least 3 characters"),
});

const toggleStatusSchema = z.object({
  challengeId: z.string().uuid(),
  status: z.enum(["draft", "published", "archived"]),
});

const deleteChallengeSchema = z.object({
  challengeId: z.string().uuid(),
});

/**
 * Generates a challenge draft using the AI Agent.
 */
export const generateQuestionAction = adminActionClient
  .schema(generateQuestionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const draft = await generateQuestionDraft({
        additionalInstructions: parsedInput.additionalInstructions,
        bugPattern: parsedInput.bugPattern,
        categoryName: parsedInput.categoryName,
        categorySlug: parsedInput.categorySlug,
        difficulty: parsedInput.difficulty,
        format: parsedInput.format,
        language: parsedInput.language,
        topic: parsedInput.topic,
      });

      return {
        draft,
        success: true,
      };
    } catch (err) {
      console.error("Failed to generate question draft:", err);
      throw new ActionError(
        "Failed to generate challenge draft with AI agent."
      );
    }
  });

/**
 * Refines an existing challenge draft with admin feedback using the AI Agent.
 */
export const refineQuestionAction = adminActionClient
  .schema(refineQuestionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const refined = await refineQuestionDraft({
        currentDraft: parsedInput.currentDraft,
        instruction: parsedInput.instruction,
      });

      return {
        draft: refined,
        success: true,
      };
    } catch (err) {
      console.error("Failed to refine question draft:", err);
      throw new ActionError("Failed to refine challenge draft.");
    }
  });

/**
 * Saves a challenge to the database as draft or published.
 */
export const saveAdminChallengeAction = adminActionClient
  .schema(saveChallengeSchema)
  .action(async ({ parsedInput }) => {
    // 1. Resolve category
    let category = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, parsedInput.categorySlug),
    });

    if (!category) {
      // Create category or find first fallback
      category = await db.query.categories.findFirst();
      if (!category) {
        const [newCat] = await db
          .insert(schema.categories)
          .values({
            description:
              "General software engineering and debugging challenges",
            name: "General Debugging",
            slug: "general-debugging",
          })
          .returning();
        category = newCat;
      }
    }

    const embedding = generateDeterministicEmbedding(
      parsedInput.rootCauseSummary
    );

    let challengeId = parsedInput.id;

    if (challengeId) {
      // Update existing challenge
      await db
        .update(schema.challenges)
        .set({
          buggyArtifact: parsedInput.buggyArtifact,
          categoryId: category.id,
          difficulty: parsedInput.difficulty,
          format: parsedInput.format,
          preventionNotes: parsedInput.preventionNotes,
          prompt: parsedInput.prompt,
          referenceFix: parsedInput.referenceFix,
          rootCauseEmbedding: embedding,
          rootCauseSummary: parsedInput.rootCauseSummary,
          source: parsedInput.source,
          status: parsedInput.status,
          title: parsedInput.title,
        })
        .where(eq(schema.challenges.id, challengeId));

      // Remove existing hints and re-insert
      await db
        .delete(schema.hints)
        .where(eq(schema.hints.challengeId, challengeId));
    } else {
      // Insert new challenge
      const [inserted] = await db
        .insert(schema.challenges)
        .values({
          buggyArtifact: parsedInput.buggyArtifact,
          categoryId: category.id,
          difficulty: parsedInput.difficulty,
          format: parsedInput.format,
          preventionNotes: parsedInput.preventionNotes,
          prompt: parsedInput.prompt,
          referenceFix: parsedInput.referenceFix,
          rootCauseEmbedding: embedding,
          rootCauseSummary: parsedInput.rootCauseSummary,
          source: parsedInput.source,
          status: parsedInput.status,
          title: parsedInput.title,
        })
        .returning();

      challengeId = inserted.id;
    }

    // Insert hints
    if (parsedInput.hints.length > 0 && challengeId) {
      await db.insert(schema.hints).values(
        parsedInput.hints.map((hint, idx) => ({
          challengeId,
          order: hint.order ?? idx + 1,
          penaltyPoints: hint.penaltyPoints ?? 10,
          socraticPrompt: hint.socraticPrompt,
        }))
      );
    }

    // Insert or update challenge embedding
    if (challengeId) {
      await db
        .delete(schema.challengeEmbeddings)
        .where(eq(schema.challengeEmbeddings.challengeId, challengeId));

      await db.insert(schema.challengeEmbeddings).values({
        challengeId,
        content: `${parsedInput.title} ${parsedInput.rootCauseSummary} ${parsedInput.prompt}`,
        embedding,
      });
    }

    revalidatePath("/challenges");
    revalidatePath("/admin/questions");

    return {
      challengeId,
      status: parsedInput.status,
      success: true,
    };
  });

/**
 * Toggles a challenge's status (draft, published, archived).
 */
export const toggleChallengeStatusAction = adminActionClient
  .schema(toggleStatusSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(schema.challenges)
      .set({
        status: parsedInput.status,
      })
      .where(eq(schema.challenges.id, parsedInput.challengeId));

    revalidatePath("/challenges");
    revalidatePath("/admin/questions");

    return {
      challengeId: parsedInput.challengeId,
      status: parsedInput.status,
      success: true,
    };
  });

/**
 * Deletes a challenge and associated data.
 */
export const deleteAdminChallengeAction = adminActionClient
  .schema(deleteChallengeSchema)
  .action(async ({ parsedInput }) => {
    // Cascade delete associated records
    await db
      .delete(schema.hints)
      .where(eq(schema.hints.challengeId, parsedInput.challengeId));

    await db
      .delete(schema.challengeEmbeddings)
      .where(
        eq(schema.challengeEmbeddings.challengeId, parsedInput.challengeId)
      );

    await db
      .delete(schema.submissions)
      .where(eq(schema.submissions.challengeId, parsedInput.challengeId));

    await db
      .delete(schema.challenges)
      .where(eq(schema.challenges.id, parsedInput.challengeId));

    revalidatePath("/challenges");
    revalidatePath("/admin/questions");

    return {
      challengeId: parsedInput.challengeId,
      success: true,
    };
  });
