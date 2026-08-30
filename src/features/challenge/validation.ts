import { z } from "zod";

export const submitChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  hintsRevealedCount: z.number().int().min(0).default(0),
  localizationLines: z.array(z.number().int().positive()).default([]),
  proposedFixCode: z.string().optional(),
  rootCauseExplanation: z.string().min(5, "validation.rootCauseMin"),
  solutionExplanation: z.string().optional(),
  timeSpentSeconds: z.number().int().min(0).default(60),
});

export const submitChallengeOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();
