"use server";
import { authActionClient } from "@/lib/safe-action";
import { submitChallenge } from "./service";
import { submitChallengeSchema } from "./validations";

export const submitChallengeAction = authActionClient
  .inputSchema(submitChallengeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await submitChallenge({
      challengeId: parsedInput.challengeId,
      hintsRevealedCount: parsedInput.hintsRevealedCount ?? 0,
      localizationLines: parsedInput.localizationLines ?? [],
      proposedFixCode: parsedInput.proposedFixCode ?? "",
      rootCauseExplanation: parsedInput.rootCauseExplanation,
      solutionExplanation: parsedInput.solutionExplanation ?? "",
      timeSpentSeconds: parsedInput.timeSpentSeconds ?? 60,
      userId: ctx.user.id,
    });
    return result;
  });
