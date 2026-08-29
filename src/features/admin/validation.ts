import { z } from "zod";

export const rawLlmChallengeSchema = z.object({
  buggyArtifact: z.object({
    buggyLines: z.tuple([z.number(), z.number()]).optional(),
    entryFile: z.string(),
    files: z.array(
      z.object({
        code: z.string(),
        isEntry: z.boolean().optional(),
        name: z.string(),
      })
    ),
    language: z.string(),
    points: z.number().optional(),
    timeLimit: z.string().optional(),
  }),
  categorySlug: z.string().optional(),
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
    diff: z
      .array(
        z.object({
          line: z.number(),
          text: z.string(),
          type: z.enum(["ctx", "add", "del"]),
        })
      )
      .optional(),
    explanation: z.string(),
    files: z.array(
      z.object({
        code: z.string(),
        name: z.string(),
      })
    ),
  }),
  rootCauseSummary: z.string(),
  title: z.string(),
});

export type RawParsedChallenge = z.infer<typeof rawLlmChallengeSchema>;

export const challengeFileSchema = z.object({
  code: z.string(),
  isEntry: z.boolean().optional(),
  name: z.string(),
});

export const diffLineSchema = z.object({
  line: z.number().optional(),
  text: z.string(),
  type: z.enum(["ctx", "add", "del"]),
});

export const generatedDraftSchema = z.object({
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

export const generateQuestionSchema = z.object({
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

export const refineQuestionSchema = z.object({
  currentDraft: generatedDraftSchema,
  instruction: z.string().min(1, "Instruction is required"),
});

export const saveChallengeSchema = z.object({
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

export const toggleStatusSchema = z.object({
  challengeId: z.string().uuid(),
  status: z.enum(["draft", "published", "archived"]),
});

export const deleteChallengeSchema = z.object({
  challengeId: z.string().uuid(),
});

export const generateQuestionOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const refineQuestionOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const saveChallengeOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const toggleStatusOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const deleteChallengeOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();
