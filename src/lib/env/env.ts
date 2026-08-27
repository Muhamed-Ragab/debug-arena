import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  isServer: typeof window === "undefined" || process.env.NODE_ENV === "test",
  server: {
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_NAME: z.string().min(2).optional(),
    ADMIN_PASSWORD: z.string().min(8).optional(),
    BETTER_AUTH_SECRET: z
      .string()
      .min(1)
      .default("dev-secret-change-me-32-chars-minimum-key"),
    BETTER_AUTH_URL: z.string().url().optional(),
    DATABASE_URL: z
      .string()
      .min(1)
      .default("postgresql://postgres:postgres@localhost:5432/debug_arena"),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    REDIS_URL: z.string().default("redis://localhost:6379"),
  },
});

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}
