import { z } from "zod";

export const ChallengeSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  categorySlug: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  format: z.enum(["code_snippet", "log_only", "ui_recording"]),
});

export const ChallengeDetailSchema = ChallengeSummarySchema.extend({
  prompt: z.string(),
  buggyArtifact: z.unknown(), // shape varies by format — refine per-format later
  hints: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number(),
      penaltyPoints: z.number(),
    })
  ),
});

export const ChallengeListQuerySchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

export const ChallengeDetailPathParamsSchema = z.object({
  id: z.string().uuid(),
});

export const ChallengeListResponseSchema = z.array(ChallengeSummarySchema);

export const ChallengeDetailErrorSchema = z.object({
  message: z.string(),
});

export type ChallengeSummary = z.infer<typeof ChallengeSummarySchema>;
export type ChallengeDetail = z.infer<typeof ChallengeDetailSchema>;
export type ChallengeListQuery = z.infer<typeof ChallengeListQuerySchema>;
export type ChallengeDetailPathParams = z.infer<
  typeof ChallengeDetailPathParamsSchema
>;
export type ChallengeListResponse = z.infer<typeof ChallengeListResponseSchema>;
export type ChallengeDetailError = z.infer<typeof ChallengeDetailErrorSchema>;
