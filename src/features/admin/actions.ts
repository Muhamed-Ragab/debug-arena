"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { invalidateLeaderboardCache } from "@/features/leaderboard/cache";
import { auth } from "@/lib/auth";
import { ActionError, adminActionClient } from "@/lib/safe-action";
import { adminService } from "./service";
import {
  deleteChallengeOutputSchema,
  deleteChallengeSchema,
  generateQuestionOutputSchema,
  generateQuestionSchema,
  refineQuestionOutputSchema,
  refineQuestionSchema,
  saveChallengeOutputSchema,
  saveChallengeSchema,
  toggleStatusOutputSchema,
  toggleStatusSchema,
  toggleUserBanOutputSchema,
  toggleUserBanSchema,
} from "./validation";

export const generateQuestionAction = adminActionClient
  .inputSchema(generateQuestionSchema)
  .outputSchema(generateQuestionOutputSchema)
  .action(async ({ parsedInput }) => {
    const draft = await adminService.generateQuestionDraft(parsedInput);
    return { draft, success: true };
  });

export const refineQuestionAction = adminActionClient
  .inputSchema(refineQuestionSchema)
  .outputSchema(refineQuestionOutputSchema)
  .action(async ({ parsedInput }) => {
    const refined = await adminService.refineQuestionDraft(parsedInput);
    return { draft: refined, success: true };
  });

export const saveAdminChallengeAction = adminActionClient
  .inputSchema(saveChallengeSchema)
  .outputSchema(saveChallengeOutputSchema)
  .action(async ({ parsedInput }) => {
    const result = await adminService.saveChallenge({
      buggyArtifact: parsedInput.buggyArtifact,
      categorySlug: parsedInput.categorySlug,
      difficulty: parsedInput.difficulty,
      format: parsedInput.format,
      hints: parsedInput.hints,
      id: parsedInput.id,
      preventionNotes: parsedInput.preventionNotes,
      prompt: parsedInput.prompt,
      referenceFix: parsedInput.referenceFix,
      rootCauseSummary: parsedInput.rootCauseSummary,
      source: parsedInput.source,
      status: parsedInput.status,
      title: parsedInput.title,
    });
    revalidatePath("/challenges");
    revalidatePath("/admin/questions");
    return result;
  });

export const toggleChallengeStatusAction = adminActionClient
  .inputSchema(toggleStatusSchema)
  .outputSchema(toggleStatusOutputSchema)
  .action(async ({ parsedInput }) => {
    const result = await adminService.toggleStatus(
      parsedInput.challengeId,
      parsedInput.status
    );
    revalidatePath("/challenges");
    revalidatePath("/admin/questions");
    return result;
  });

export const deleteAdminChallengeAction = adminActionClient
  .inputSchema(deleteChallengeSchema)
  .outputSchema(deleteChallengeOutputSchema)
  .action(async ({ parsedInput }) => {
    const result = await adminService.deleteChallengeCascade(
      parsedInput.challengeId
    );
    revalidatePath("/challenges");
    revalidatePath("/admin/questions");
    return result;
  });

export const toggleUserBanAction = adminActionClient
  .inputSchema(toggleUserBanSchema)
  .outputSchema(toggleUserBanOutputSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.userId === ctx.user.id) {
      throw new ActionError("error.cannotBanSelf");
    }
    const requestHeaders = await headers();
    if (parsedInput.banned) {
      await auth.api.banUser({
        body: {
          banExpiresIn: parsedInput.banExpiresIn,
          banReason: parsedInput.banReason ?? "Admin ban",
          userId: parsedInput.userId,
        },
        headers: requestHeaders,
      });
    } else {
      await auth.api.unbanUser({
        body: {
          userId: parsedInput.userId,
        },
        headers: requestHeaders,
      });
    }
    await invalidateLeaderboardCache();
    revalidatePath("/admin/users");
    revalidatePath("/leaderboard");
    return {
      banned: parsedInput.banned,
      success: true,
      userId: parsedInput.userId,
    };
  });
