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
      message: "Use only letters, numbers, and underscores in the username.",
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

export const exportSubmissionsInputSchema = z.object({
  format: z.enum(["json", "csv"]),
});

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

export const exportSubmissionsOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const saveApiKeyInputSchema = z.object({
  apiKey: z.string().min(1, "API key cannot be empty"),
  provider: z.enum(["groq", "openai", "anthropic", "google"]),
});

export const saveApiKeyOutputSchema = z
  .object({
    keyPreview: z.string().optional(),
    provider: z.string().optional(),
    success: z.boolean(),
  })
  .passthrough();

export const deleteApiKeyInputSchema = z.object({
  provider: z.enum(["groq", "openai", "anthropic", "google"]),
});

export const deleteApiKeyOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const updateAiSettingsInputSchema = z.object({
  activeModel: z.string().min(1, "Active model cannot be empty"),
  activeProvider: z.enum(["platform", "groq", "openai", "anthropic", "google"]),
  customModel: z.string().optional().nullable(),
});

export const updateAiSettingsOutputSchema = z
  .object({ success: z.boolean() })
  .passthrough();

export const testConnectionInputSchema = z.object({
  apiKey: z.string().optional(),
  modelId: z.string().optional(),
  provider: z.enum(["platform", "groq", "openai", "anthropic", "google"]),
});

export const testConnectionOutputSchema = z
  .object({
    error: z.string().optional(),
    latencyMs: z.number(),
    success: z.boolean(),
  })
  .passthrough();
