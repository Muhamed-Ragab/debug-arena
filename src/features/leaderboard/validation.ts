import { z } from "zod";

export const getLeaderboardInputSchema = z.object({
  categorySlug: z.string().max(100).nullable().optional(),
  period: z.enum(["weekly", "all_time"]).default("weekly"),
});

export const getLeaderboardOutputSchema = z
  .object({
    entries: z.array(
      z.object({
        avgScore: z.number(),
        isUser: z.boolean().optional(),
        name: z.string(),
        rank: z.number(),
        score: z.number(),
        solved: z.number(),
        streak: z.number(),
        strongest: z.string(),
        userId: z.string().optional(),
      })
    ),
    success: z.boolean(),
  })
  .passthrough();

export type GetLeaderboardInput = z.infer<typeof getLeaderboardInputSchema>;
