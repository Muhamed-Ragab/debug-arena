import { z } from "zod";

export const rawLlmChallengeSchema = z.object({
  buggyArtifact: z
    .object({
      buggyLines: z
        .tuple([z.number(), z.number()])
        .nullable()
        .describe(
          "Inclusive 1-indexed line range of the bug in the entry file, or null to auto-detect"
        ),
      entryFile: z
        .string()
        .describe("Entry file name, e.g. Chat.tsx or index.ts"),
      files: z
        .array(
          z.object({
            code: z.string().describe("Full file content, syntactically valid"),
            isEntry: z
              .boolean()
              .describe(
                "true for entry file, false otherwise; exactly one file should be true"
              ),
            name: z.string().describe("File name with extension"),
          })
        )
        .describe("All challenge files for the buggy artifact"),
      language: z.string().describe("Programming language, e.g. typescript"),
      points: z
        .number()
        .nullable()
        .describe("Points for difficulty: 100 easy, 200 medium, 300 hard"),
      timeLimit: z
        .string()
        .nullable()
        .describe("Time limit string like '15 min', '20 min', '30 min'"),
    })
    .describe("Buggy artifact containing files and metadata"),
  categorySlug: z
    .string()
    .nullable()
    .describe("Category slug, e.g. react-rendering"),
  difficulty: z.enum(["easy", "medium", "hard"]).describe("Difficulty level"),
  format: z
    .enum(["code_snippet", "log_only", "ui_recording"])
    .describe("Challenge format, usually code_snippet"),
  hiddenTests: z
    .array(
      z.object({
        description: z.string().describe("What the test verifies"),
        name: z.string().describe("Short test identifier, kebab-case"),
        testCode: z
          .string()
          .describe("Vitest test code importing from entry file"),
      })
    )
    .nullable()
    .describe("Hidden tests that validate the fix"),
  hints: z
    .array(
      z.object({
        order: z.number().describe("1-indexed order"),
        penaltyPoints: z.number().describe("Penalty points for this hint"),
        socraticPrompt: z
          .string()
          .describe("Socratic question guiding toward root cause"),
      })
    )
    .nullable()
    .describe("Exactly 3 socratic hints in increasing specificity"),
  preventionNotes: z
    .string()
    .nullable()
    .describe(
      "Brief prevention guidance, 1-2 sentences on how to avoid the bug in production"
    ),
  prompt: z
    .string()
    .describe(
      "Challenge prompt for the developer: describes symptom and asks to fix the bug"
    ),
  referenceFix: z
    .object({
      diff: z
        .array(
          z.object({
            line: z.number().describe("1-indexed line number in fixed file"),
            text: z.string().describe("Line content"),
            type: z
              .enum(["ctx", "add", "del"])
              .describe("ctx=context, add, del"),
          })
        )
        .nullable()
        .describe("Unified diff lines, or null to auto-compute"),
      explanation: z
        .string()
        .describe("1-3 sentence explanation of what was fixed and why"),
      files: z
        .array(
          z.object({
            code: z.string().describe("Full fixed file content, valid syntax"),
            name: z.string().describe("File name matching buggy artifact"),
          })
        )
        .describe("All fixed files, same names as buggy artifact"),
    })
    .nullable()
    .describe("Reference fix with corrected files and explanation"),
  rootCauseSummary: z
    .string()
    .nullable()
    .describe(
      "Concise 1-2 sentence root cause summary, e.g. stale closure over initial state"
    ),
  title: z.string().describe("Short, descriptive challenge title"),
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

export const toggleUserBanSchema = z.object({
  banExpiresIn: z.number().int().positive().optional(),
  banned: z.boolean(),
  banReason: z.string().max(500).optional(),
  userId: z.string().uuid(),
});

export const listAdminChallengesQuerySchema = z.object({
  difficulty: z.enum(["all", "easy", "medium", "hard"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().max(200).optional().default(""),
  sortBy: z.enum(["createdAt", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  source: z
    .enum(["all", "manual", "ai_generated", "postmortem_import"])
    .default("all"),
  status: z.enum(["all", "draft", "published", "archived"]).default("all"),
});

export type ListAdminChallengesQuery = z.infer<
  typeof listAdminChallengesQuerySchema
>;

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

export const toggleUserBanOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const listAdminChallengesOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();
