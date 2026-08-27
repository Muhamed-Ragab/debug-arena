import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { redisStorage } from "@better-auth/redis-storage";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { validator } from "validation-better-auth";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { env } from "@/lib/env/env";
import { getRedis } from "@/lib/redis";
import { buildSocialProviders } from "./social-providers";
import {
  forgetPasswordSchema,
  signInEmailSchema,
  signUpEmailSchema,
} from "./validation";

export const auth = betterAuth({
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  baseURL: env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema },
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    admin(),
    nextCookies(),
    validator([
      {
        path: "/sign-up/email",
        schema: signUpEmailSchema,
      },
      {
        path: "/sign-in/email",
        schema: signInEmailSchema,
      },
      {
        path: "/forget-password",
        schema: forgetPasswordSchema,
      },
    ]),
  ],
  rateLimit: {
    enabled: true,
    max: 100,
    storage: "secondary-storage", // Moves counter checks to Redis
    window: 60,
  },
  secondaryStorage: redisStorage({
    client: getRedis(),
  }),
  secret: env.BETTER_AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    storeSessionInDatabase: false,
    updateAge: 60 * 60 * 24, // 1 day
  },
  socialProviders: buildSocialProviders(),
  trustedOrigins: env.BETTER_AUTH_URL
    ? [env.BETTER_AUTH_URL]
    : ["http://localhost:3000"],
  verification: {
    storeInDatabase: false,
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
