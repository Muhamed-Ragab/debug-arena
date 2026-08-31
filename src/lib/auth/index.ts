import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { locales as authLocales, i18n } from "@better-auth/i18n";
import { redisStorage } from "@better-auth/redis-storage";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin, haveIBeenPwned, lastLoginMethod } from "better-auth/plugins";
import { validator } from "validation-better-auth";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { hasConsentForLastLogin } from "@/lib/consent/hasConsent";
import { env } from "@/lib/env/env";
import { getRedis } from "@/lib/redis";
import { buildSocialProviders } from "./social-providers";
import {
  forgetPasswordSchema,
  signInEmailSchema,
  signUpEmailSchema,
} from "./validation";

export const auth = betterAuth({
  account: {
    accountLinking: {
      allowDifferentEmails: false,
      enabled: true,
      trustedProviders: ["google"],
    },
  },
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
    i18n({
      defaultLocale: "en",
      detection: ["cookie", "header", "session"],
      localeCookie: "NEXT_LOCALE",
      translations: { ar: authLocales.ar, en: authLocales.en },
      userLocaleField: "locale",
    }),
    haveIBeenPwned({
      enabled: process.env.NODE_ENV !== "test",
    }),
    lastLoginMethod({
      // GDPR: non-essential cookie; DB disabled, cookie-only when consent granted.
      beforeStoreCookie: (ctx) => {
        const raw =
          ctx.headers?.get("cookie") ??
          ctx.request?.headers.get("cookie") ??
          "";
        return hasConsentForLastLogin(raw);
      },
      cookieName: "better-auth.last_used_login_method",
      maxAge: 60 * 60 * 24 * 30,
      schema: {
        user: {
          lastLoginMethod: "last_login_method",
        },
      },
      storeInDatabase: false,
    }),
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
  user: {
    additionalFields: {
      avatarUrl: { required: false, type: "string" },
      bio: { required: false, type: "string" },
      displayName: { required: false, type: "string" },
      interests: { required: false, type: "string[]" },
      isPublic: { required: false, type: "boolean" },
      jobTitle: { required: false, type: "string" },
      locale: { required: false, type: "string" },
      preferredColor: { required: false, type: "string" },
      role: { input: false, required: false, type: "string" },
      username: { required: false, type: "string" },
    },
  },
  verification: {
    storeInDatabase: false,
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
