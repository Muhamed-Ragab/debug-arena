import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

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

export const challengesContract = c.router({
  list: {
    method: "GET",
    path: "/challenges",
    query: z.object({
      category: z.string().optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    }),
    responses: {
      200: z.array(ChallengeSummarySchema),
    },
  },
  detail: {
    method: "GET",
    path: "/challenges/:id",
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: ChallengeDetailSchema,
      404: z.object({ message: z.string() }),
    },
  },
});
