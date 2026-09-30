"use server";

import { authActionClient } from "@/lib/safe-action";
import { leaderboardService } from "./service";
import {
  getLeaderboardInputSchema,
  getLeaderboardOutputSchema,
} from "./validation";

export const getLeaderboardAction = authActionClient
  .inputSchema(getLeaderboardInputSchema)
  .outputSchema(getLeaderboardOutputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const entries = await leaderboardService.getTopLeaderboard({
      ...parsedInput,
      currentUserId: ctx.user.id,
    });
    return { entries, success: true };
  });
