import { betterAuth, type SecondaryStorage } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, getRedis, schema } from "../../core";
import { buildSocialProviders } from "./social-providers";

// Sessions and verification codes live in Redis (secondaryStorage), not
// Postgres: fast revocation, TTL-native expiry, and single-use code semantics
// via atomic GETDEL. The verifications table stays mapped as a fallback.
const redis = getRedis();

const redisSecondaryStorage: SecondaryStorage = {
  get: (key) => redis.get(key),
  getAndDelete: (key) => redis.getdel(key),
  set: async (key, value, ttl) => {
    if (ttl) await redis.set(key, value, "EX", ttl);
    else await redis.set(key, value);
  },
  delete: async (key) => {
    await redis.del(key);
  },
  increment: async (key, ttl) => {
    const value = await redis.incr(key);
    if (value === 1) await redis.expire(key, ttl);
    return value;
  },
};

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
      account: schema.accounts,
      verification: schema.verifications,
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
  secondaryStorage: redisSecondaryStorage,
  verification: {
    storeIdentifier: "hashed", // codes are single-use secrets; don't store raw
    storeInDatabase: false, // Redis only
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // sliding refresh daily
    // secondaryStorage present -> sessions live in Redis by default; this is
    // explicit so a reader knows DB session persistence is a deliberate off.
    storeSessionInDatabase: false,
  },
  advanced: {
    // Generate UUID ids so inserts satisfy the uuid PK columns in our schema
    // (keeps FK-compatible ids). 1.7.1 exposes this under database.generateId.
    database: {
      generateId: "uuid",
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false }, // read in guards via req.user.role
    },
  },
  socialProviders: buildSocialProviders(process.env),
});
