import { z } from "zod";

export const SubmitAttemptSchema = z.object({
  challengeId: z.string().uuid(),
  localizationAnswer: z.string().optional(),
  rootCauseExplanation: z.string(),
  proposedFix: z.unknown(),
  preventionAnswer: z.string().optional(),
  hintsUsed: z.number().default(0),
  timeSpentSeconds: z.number().optional(),
});

export const SubmissionResultSchema = z.object({
  id: z.string().uuid(),
  localizationCorrect: z.boolean().nullable(),
  rootCauseScore: z.number().nullable(),
  fixCorrect: z.boolean().nullable(),
  preventionScore: z.number().nullable(),
  totalScore: z.number().nullable(),
  canonicalRootCauseSummary: z.string(),
  feedback: z.string().optional(),
});

export const SubmissionErrorSchema = z.object({
  message: z.string(),
});

export type SubmitAttempt = z.infer<typeof SubmitAttemptSchema>;
export type SubmissionResult = z.infer<typeof SubmissionResultSchema>;
export type SubmissionError = z.infer<typeof SubmissionErrorSchema>;
