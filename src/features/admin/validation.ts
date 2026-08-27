import { z } from "zod";

export const rawLlmChallengeSchema = z.object({
  buggyArtifact: z.object({
    buggyLines: z.tuple([z.number(), z.number()]).optional(),
    entryFile: z.string().default("index.ts"),
    files: z.array(
      z.object({
        code: z.string(),
        isEntry: z.boolean().optional(),
        name: z.string(),
      })
    ),
    language: z.string().default("typescript"),
    points: z.number().optional(),
    timeLimit: z.string().optional(),
  }),
  categorySlug: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
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
      penaltyPoints: z.number().default(10),
      socraticPrompt: z.string(),
    })
  ),
  preventionNotes: z.string(),
  prompt: z.string(),
  referenceFix: z.object({
    diff: z
      .array(
        z.object({
          line: z.number().optional(),
          text: z.string(),
          type: z.enum(["ctx", "add", "del"]),
        })
      )
      .optional(),
    explanation: z.string().default(""),
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
