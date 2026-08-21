import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

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

export const submissionsContract = c.router({
  submit: {
    method: "POST",
    path: "/submissions",
    body: SubmitAttemptSchema,
    responses: {
      201: SubmissionResultSchema,
      400: z.object({ message: z.string() }),
    },
  },
});
