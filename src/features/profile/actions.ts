"use server";

import { revalidatePath } from "next/cache";
import { testProviderConnection } from "@/lib/ai/test-connection";
import { decryptApiKey } from "@/lib/crypto/encryption";
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

export const revokeSessionAction = authActionClient
  .inputSchema(revokeSessionSchema)
  .outputSchema(revokeSessionOutputSchema)
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

export const revokeAllOtherSessionsAction = authActionClient
  .inputSchema(revokeAllOtherSessionsSchema)
  .outputSchema(revokeAllOtherSessionsOutputSchema)
  .action(async ({ ctx }) => {
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
    const { provider, modelId } = parsedInput;
    let effectiveKey = parsedInput.apiKey?.trim();

    if (!effectiveKey && provider !== "platform") {
      const existingKeyRow = await profileRepository.findApiKeyByProvider(
        userId,
        provider
      );
      if (!existingKeyRow) {
        return {
          error: `No saved API key found for ${provider}`,
          latencyMs: 0,
          success: false,
        };
      }
      effectiveKey = decryptApiKey(existingKeyRow.encryptedApiKey);
    }

    const result = await testProviderConnection(
      provider,
      effectiveKey || "",
      modelId
    );
    return {
      error: result.error,
      latencyMs: result.latencyMs,
      success: result.success,
    };
  });
