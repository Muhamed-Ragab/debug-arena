import { z } from "zod";

export const editProfileSchema = z.object({
  avatarUrl: z.string().url().or(z.literal("")).optional().nullable(),
  bio: z.string().max(300).optional().nullable(),
  displayName: z.string().min(2).max(50),
  interests: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  jobTitle: z.string().max(100).optional().nullable(),
  preferredColor: z.string().max(30).optional().nullable(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "validation.usernameFormat",
    }),
});

export const unlinkAccountSchema = z.object({
  providerId: z.enum(["google"]),
});

export const revokeSessionSchema = z.object({
  sessionId: z.string(),
});

export const revokeAllOtherSessionsSchema = z.object({}).passthrough();

export const deleteAccountSchema = z.object({}).passthrough();

export const editProfileOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const unlinkAccountOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const revokeSessionOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const revokeAllOtherSessionsOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const deleteAccountOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();
