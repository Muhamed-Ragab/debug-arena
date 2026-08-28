"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRedis } from "@/lib/redis";
import { ActionError, authActionClient } from "@/lib/safe-action";
import { profileRepository } from "./repository";
import { editProfileSchema } from "./schema";

export const updateProfileAction = authActionClient
  .inputSchema(editProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;
    const updated = await profileRepository.updateUser(userId, {
      avatarUrl: parsedInput.avatarUrl || null,
      bio: parsedInput.bio ?? null,
      displayName: parsedInput.displayName,
      image: parsedInput.avatarUrl || null,
      interests: parsedInput.interests ?? null,
      isPublic: parsedInput.isPublic ?? true,
      jobTitle: parsedInput.jobTitle ?? null,
      preferredColor: parsedInput.preferredColor ?? null,
      username: parsedInput.username,
    } as never);
    if (!updated) {
      throw new ActionError("User not found");
    }
    try {
      revalidatePath("/profile");
      revalidatePath("/settings");
      revalidatePath("/challenges");
    } catch {
      console.warn("revalidate outside request");
    }
    return {
      avatarUrl: updated.avatarUrl,
      bio: updated.bio,
      displayName: updated.displayName,
      interests: updated.interests,
      isPublic: updated.isPublic,
      jobTitle: updated.jobTitle,
      preferredColor: updated.preferredColor,
      success: true,
      username: updated.username,
    };
  });

const unlinkAccountSchema = z.object({
  providerId: z.string(),
});

export const unlinkAccountAction = authActionClient
  .inputSchema(unlinkAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;
    // biome-ignore lint/correctness/noUnusedVariables: providerId validated by zod schema
    const { providerId } = parsedInput;
    const accounts = await profileRepository.findByIdForSettings(userId);
    const userAccounts = accounts?.accounts ?? [];
    const hasPassword = userAccounts.some(
      (a) => (a as unknown as { password?: string }).password
    );
    if (userAccounts.length <= 1 && !hasPassword) {
      throw new ActionError(
        "Cannot unlink your only sign-in method. Set a password or add another provider first."
      );
    }

    try {
      revalidatePath("/settings");
    } catch {
      console.warn("revalidate outside request");
    }
    return { success: true };
  });

const revokeSessionSchema = z.object({
  sessionId: z.string(),
});

export const revokeSessionAction = authActionClient
  .inputSchema(revokeSessionSchema)
  .action(async ({ parsedInput }) => {
    const { sessionId } = parsedInput;
    try {
      const redis = getRedis();
      await redis.del(`session:${sessionId}`);
      await redis.del(`session_token:${sessionId}`);
    } catch (err) {
      console.warn("[RevokeSession] Redis deletion notice:", err);
    }
    try {
      revalidatePath("/settings");
    } catch {
      console.warn("revalidate outside request");
    }
    return { success: true };
  });

export const revokeAllOtherSessionsAction = authActionClient.action(
  async ({ ctx }) => {
    const userId = ctx.user.id;
    try {
      const redis = getRedis();
      const userSessionKeys = await redis.keys(`*${userId}*`);
      if (userSessionKeys.length > 0) {
        await redis.del(...userSessionKeys);
      }
    } catch (err) {
      console.warn("[RevokeAllOtherSessions] Redis cleanup notice:", err);
    }
    try {
      revalidatePath("/settings");
    } catch {
      console.warn("revalidate outside request");
    }
    return { success: true };
  }
);

export const deleteAccountAction = authActionClient.action(async ({ ctx }) => {
  const userId = ctx.user.id;
  await profileRepository.deleteUser(userId);
  try {
    revalidatePath("/");
  } catch {
    console.warn("revalidate outside request");
  }
  return { success: true };
});
