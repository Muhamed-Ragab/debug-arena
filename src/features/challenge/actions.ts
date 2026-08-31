"use server";
import { ActionError, authActionClient } from "@/lib/safe-action";
import { challengeService } from "./service";
import {
  submitChallengeOutputSchema,
  submitChallengeSchema,
} from "./validation";

export const submitChallengeAction = authActionClient
  .inputSchema(submitChallengeSchema)
  .outputSchema(submitChallengeOutputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { role } = ctx.user;
    if (role === "admin") {
      throw new ActionError("error.forbiddenAdminSubmit");
    }
    const result = await challengeService.submitChallenge({
      challengeId: parsedInput.challengeId,
      hintsRevealedCount: parsedInput.hintsRevealedCount ?? 0,
      localizationLines: parsedInput.localizationLines ?? [],
      proposedFixCode: parsedInput.proposedFixCode ?? "",
      rootCauseExplanation: parsedInput.rootCauseExplanation,
      solutionExplanation: parsedInput.solutionExplanation ?? "",
      timeSpentSeconds: parsedInput.timeSpentSeconds ?? 60,
      userId: ctx.user.id,
    });
    return { ...result, success: true };
  });
