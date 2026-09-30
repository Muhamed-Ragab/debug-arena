import { z } from "zod";

export const submitChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  hintsRevealedCount: z.number().int().min(0).default(0),
  localizationLines: z.array(z.number().int().positive()).default([]),
  proposedFixCode: z.string().optional(),
  rootCauseExplanation: z
    .string()
    .min(5, "The root cause explanation must be at least 5 characters."),
  solutionExplanation: z.string().optional(),
  timeSpentSeconds: z.number().int().min(0).default(60),
});

export const submitChallengeOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const listChallengesQuerySchema = z.object({
  category: z.string().max(100).optional().default("all"),
  difficulty: z.string().max(50).optional().default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(6),
  search: z.string().max(200).optional().default(""),
});

export type ListChallengesQuery = z.infer<typeof listChallengesQuerySchema>;

export const listChallengesOutputSchema = z
  .object({
    items: z.array(z.unknown()),
    page: z.number(),
    pageSize: z.number(),
    success: z.boolean(),
    total: z.number(),
    totalPages: z.number(),
  })
  .passthrough();
