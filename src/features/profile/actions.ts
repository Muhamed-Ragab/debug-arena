"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRedis } from "@/lib/redis";
import { ActionError, authActionClient } from "@/lib/safe-action";
import { profileRepository } from "./repository";
import { profileService } from "./service";
import {
  deleteAccountOutputSchema,
  deleteAccountSchema,
  deleteApiKeyInputSchema,
  deleteApiKeyOutputSchema,
  editProfileOutputSchema,
  editProfileSchema,
  exportSubmissionsInputSchema,
  exportSubmissionsOutputSchema,
  revokeAllOtherSessionsOutputSchema,
  revokeAllOtherSessionsSchema,
  revokeSessionOutputSchema,
  revokeSessionSchema,
  saveApiKeyInputSchema,
  saveApiKeyOutputSchema,
  testConnectionInputSchema,
  testConnectionOutputSchema,
  unlinkAccountOutputSchema,
  unlinkAccountSchema,
  updateAiSettingsInputSchema,
  updateAiSettingsOutputSchema,
} from "./validation";

export const updateProfileAction = authActionClient
  .inputSchema(editProfileSchema)
  .outputSchema(editProfileOutputSchema)
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
      throw new ActionError("User not found.");
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

export const unlinkAccountAction = authActionClient
  .inputSchema(unlinkAccountSchema)
  .outputSchema(unlinkAccountOutputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;
    const { providerId } = parsedInput;
    if (providerId !== "google") {
      throw new ActionError("Provider not available");
    }
    const accounts = await profileRepository.findByIdForSettings(userId);
    const userAccounts = accounts?.accounts ?? [];
    const hasPassword = userAccounts.some(
      (a) => (a as unknown as { password?: string }).password
    );
    if (userAccounts.length <= 1 && !hasPassword) {
      throw new ActionError(
        "Link another sign-in method before disconnecting this one."
      );
    }

    try {
      revalidatePath("/settings");
    } catch {
      console.warn("revalidate outside request");
    }
    return { success: true };
  });

async function evictSessionInRedis(
  userId: string,
  sessionId: string
): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(sessionId);
    await redis.del(`session:${sessionId}`);
    await redis.del(`session_token:${sessionId}`);

    const rawList = await redis.get(`active-sessions-${userId}`);
    if (!rawList) {
      return;
    }
    const list = JSON.parse(rawList);
    if (!Array.isArray(list)) {
      return;
    }

    const filtered = list.filter((item: unknown) => {
      if (typeof item === "string") {
        return item !== sessionId;
      }
      if (item && typeof item === "object") {
        const record = item as { id?: string; token?: string };
        return record.token !== sessionId && record.id !== sessionId;
      }
      return true;
    });

    if (filtered.length > 0) {
      await redis.set(`active-sessions-${userId}`, JSON.stringify(filtered));
    } else {
      await redis.del(`active-sessions-${userId}`);
    }
  } catch (err) {
    console.warn("[RevokeSession] Redis eviction notice:", err);
  }
}

async function cleanupOtherSessionsInRedis(
  userId: string,
  currentSessionToken: string
): Promise<void> {
  try {
    const redis = getRedis();
    const rawList = await redis.get(`active-sessions-${userId}`);
    if (!rawList) {
      return;
    }
    const list = JSON.parse(rawList);
    if (!Array.isArray(list)) {
      return;
    }

    const tokensToDelete: string[] = [];
    const remaining: unknown[] = [];
    for (const item of list) {
      const token =
        typeof item === "string" ? item : (item as { token?: string }).token;
      if (token && token !== currentSessionToken) {
        tokensToDelete.push(token);
      } else {
        remaining.push(item);
      }
    }

    if (tokensToDelete.length > 0) {
      await redis.del(...tokensToDelete);
    }
    if (remaining.length > 0) {
      await redis.set(`active-sessions-${userId}`, JSON.stringify(remaining));
    } else {
      await redis.del(`active-sessions-${userId}`);
    }
  } catch (err) {
    console.warn("[RevokeAllOtherSessions] Redis cleanup notice:", err);
  }
}

export const revokeSessionAction = authActionClient
  .inputSchema(revokeSessionSchema)
  .outputSchema(revokeSessionOutputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { sessionId } = parsedInput;
    const userId = ctx.user.id;
    try {
      const reqHeaders = await headers();
      await auth.api.revokeSession({
        body: { token: sessionId },
        headers: reqHeaders,
      });
    } catch (err) {
      console.warn("[RevokeSession] Better-Auth revokeSession notice:", err);
    }

    await evictSessionInRedis(userId, sessionId);

    try {
      revalidatePath("/settings");
    } catch {
      console.warn("revalidate outside request");
    }
    return { success: true };
  });

export const revokeAllOtherSessionsAction = authActionClient
  .inputSchema(revokeAllOtherSessionsSchema)
  .outputSchema(revokeAllOtherSessionsOutputSchema)
  .action(async ({ ctx }) => {
    const userId = ctx.user.id;
    const currentSessionToken = ctx.session.token;
    try {
      const reqHeaders = await headers();
      await auth.api.revokeOtherSessions({
        headers: reqHeaders,
      });
    } catch (err) {
      console.warn(
        "[RevokeAllOtherSessions] Better-Auth revokeOtherSessions notice:",
        err
      );
    }

    await cleanupOtherSessionsInRedis(userId, currentSessionToken);

    try {
      revalidatePath("/settings");
    } catch {
      console.warn("revalidate outside request");
    }
    return { success: true };
  });

export const deleteAccountAction = authActionClient
  .inputSchema(deleteAccountSchema)
  .outputSchema(deleteAccountOutputSchema)
  .action(async ({ ctx }) => {
    const userId = ctx.user.id;
    await profileRepository.deleteUser(userId);
    try {
      revalidatePath("/");
    } catch {
      console.warn("revalidate outside request");
    }
    return { success: true };
  });

export const exportSubmissionsAction = authActionClient
  .inputSchema(exportSubmissionsInputSchema)
  .outputSchema(exportSubmissionsOutputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;
    const result = await profileService.exportUserSubmissions(
      userId,
      parsedInput.format
    );
    return {
      content: result.content,
      filename: result.filename,
      mimeType: result.mimeType,
      success: true,
    };
  });

export const saveApiKeyAction = authActionClient
  .inputSchema(saveApiKeyInputSchema)
  .outputSchema(saveApiKeyOutputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;
    const { provider, apiKey } = parsedInput;
    const result = await profileService.saveApiKey(userId, provider, apiKey);
    try {
      revalidatePath("/settings");
    } catch {
      console.warn("revalidate outside request");
    }
    return {
      id: result.id,
      keyPreview: result.keyPreview,
      provider: result.provider,
      success: true,
    };
  });

export const deleteApiKeyAction = authActionClient
  .inputSchema(deleteApiKeyInputSchema)
  .outputSchema(deleteApiKeyOutputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;
    const { provider } = parsedInput;
    await profileService.deleteApiKey(userId, provider);
    try {
      revalidatePath("/settings");
    } catch {
      console.warn("revalidate outside request");
    }
    return { success: true };
  });

export const updateAiSettingsAction = authActionClient
  .inputSchema(updateAiSettingsInputSchema)
  .outputSchema(updateAiSettingsOutputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;
    try {
      await profileService.updateAiSettings(userId, parsedInput);
    } catch (err) {
      throw new ActionError(
        err instanceof Error ? err.message : "Failed to update AI settings",
        { cause: err }
      );
    }
    try {
      revalidatePath("/settings");
      revalidatePath("/challenges");
    } catch {
      console.warn("revalidate outside request");
    }
    return { success: true };
  });

export const testConnectionAction = authActionClient
  .inputSchema(testConnectionInputSchema)
  .outputSchema(testConnectionOutputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;
    const { provider, modelId, apiKey } = parsedInput;

    const result = await profileService.testConnection(
      userId,
      provider,
      apiKey,
      modelId
    );

    return {
      error: result.error,
      latencyMs: result.latencyMs,
      success: result.success,
    };
  });
