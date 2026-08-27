"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { getRedis } from "@/lib/redis";
import { ActionError, authActionClient } from "@/lib/safe-action";
import { editProfileSchema } from "./schema";

export const updateProfileAction = authActionClient
  .inputSchema(editProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const {
      bio,
      displayName,
      username,
      jobTitle,
      preferredColor,
      avatarUrl,
      interests,
      isPublic,
    } = parsedInput;
    const userId = ctx.user.id;

    // Check if username is taken by another user
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.username, username),
    });

    if (existing && existing.id !== userId) {
      throw new ActionError("Username is already taken by another user.");
    }

    const [updated] = await db
      .update(schema.users)
      .set({
        avatarUrl: avatarUrl || null,
        bio: bio ?? null,
        displayName,
        image: avatarUrl || null,
        interests: interests ?? null,
        isPublic: isPublic ?? true,
        jobTitle: jobTitle ?? null,
        preferredColor: preferredColor ?? null,
        updatedAt: new Date(),
        username,
      })
      .where(eq(schema.users.id, userId))
      .returning();

    try {
      revalidatePath("/profile");
      revalidatePath("/settings");
      revalidatePath("/challenges");
    } catch {
      // Non-request context
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
    const { providerId } = parsedInput;

    const userAccounts = await db.query.accounts.findMany({
      where: eq(schema.accounts.userId, userId),
    });

    const hasPassword = userAccounts.some(
      (a) => a.password !== null && a.password !== undefined
    );

    if (userAccounts.length <= 1 && !hasPassword) {
      throw new ActionError(
        "Cannot unlink your only sign-in method. Set a password or add another provider first."
      );
    }

    await db
      .delete(schema.accounts)
      .where(
        and(
          eq(schema.accounts.userId, userId),
          eq(schema.accounts.providerId, providerId)
        )
      );

    try {
      revalidatePath("/settings");
    } catch {
      // Non-request context
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
      // Remove session from redis
      await redis.del(`session:${sessionId}`);
      await redis.del(`session_token:${sessionId}`);
    } catch (err) {
      console.warn("[RevokeSession] Redis deletion notice:", err);
    }

    try {
      revalidatePath("/settings");
    } catch {
      // Non-request context
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
      // Non-request context
    }

    return { success: true };
  }
);

export const deleteAccountAction = authActionClient.action(async ({ ctx }) => {
  const userId = ctx.user.id;

  await db.delete(schema.users).where(eq(schema.users.id, userId));

  try {
    revalidatePath("/");
  } catch {
    // Non-request context
  }

  return { success: true };
});
