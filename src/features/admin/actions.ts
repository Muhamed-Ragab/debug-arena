"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, adminActionClient } from "@/lib/safe-action";
import {
  deleteChallengeCascade,
  generateQuestionDraft,
  refineQuestionDraft,
  saveChallenge,
  toggleStatus,
} from "./service";

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

export const generateQuestionAction = adminActionClient
  .schema(generateQuestionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const draft = await generateQuestionDraft(parsedInput);
      return { draft, success: true };
    } catch (err) {
      throw new ActionError(
        "Failed to generate challenge draft with AI agent.",
        {
          cause: err,
        }
      );
    }
  });

export const refineQuestionAction = adminActionClient
  .schema(refineQuestionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const refined = await refineQuestionDraft(parsedInput);
      return { draft: refined, success: true };
    } catch (err) {
      throw new ActionError("Failed to refine challenge draft.", {
        cause: err,
      });
    }
  });

export const saveAdminChallengeAction = adminActionClient
  .schema(saveChallengeSchema)
  .action(async ({ parsedInput }) => {
    const result = await saveChallenge({
      buggyArtifact: parsedInput.buggyArtifact,
      categorySlug: parsedInput.categorySlug,
      difficulty: parsedInput.difficulty,
      format: parsedInput.format,
      hints: parsedInput.hints,
      id: parsedInput.id,
      preventionNotes: parsedInput.preventionNotes,
      prompt: parsedInput.prompt,
      referenceFix: parsedInput.referenceFix,
      rootCauseSummary: parsedInput.rootCauseSummary,
      source: parsedInput.source,
      status: parsedInput.status,
      title: parsedInput.title,
    });
    revalidatePath("/challenges");
    revalidatePath("/admin/questions");
    return result;
  });

export const toggleChallengeStatusAction = adminActionClient
  .schema(toggleStatusSchema)
  .action(async ({ parsedInput }) => {
    const result = await toggleStatus(
      parsedInput.challengeId,
      parsedInput.status
    );
    revalidatePath("/challenges");
    revalidatePath("/admin/questions");
    return result;
  });

export const deleteAdminChallengeAction = adminActionClient
  .schema(deleteChallengeSchema)
  .action(async ({ parsedInput }) => {
    const result = await deleteChallengeCascade(parsedInput.challengeId);
    revalidatePath("/challenges");
    revalidatePath("/admin/questions");
    return result;
  });
