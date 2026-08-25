import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@debug-arena/db";
import * as schema from "@debug-arena/db";
import { buildSocialProviders } from "./social-providers";

export const auth = betterAuth({
  // Mounted by @thallesp/nestjs-better-auth at this path. The SPA calls
  // /api/auth/* through the Vite proxy, which strips /api -> /auth reaches Nest.
  basePath: "/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.oauthAccounts, // Task 2 repoints this to schema.accounts
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // SMTP integration is a later phase
    sendResetPassword: async ({ user, url }) => {
      // Dev delivery: real SMTP/email templates land in a later phase
      // (implementation_guide.md §8). Log so devs can complete resets locally.
      console.log(`[auth] password reset link for ${user.email}: ${url}`);
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // sliding refresh daily
  },
  advanced: {
    // Generate UUID ids so inserts satisfy the uuid PK columns in our schema
    // (keeps FK-compatible ids). 1.7.1 exposes this under database.generateId.
    database: {
      generateId: "uuid",
    },
  },
  user: {
    fields: {
      // Our users table predates better-auth defaults; map the one column
      // whose name differs (name/image columns added in Task 2).
      emailVerified: "email_verified_at",
    },
  },
  socialProviders: buildSocialProviders(process.env),
});
