import { describe, expect, it } from "vitest";
import { env } from "./env";

describe("env configuration", () => {
  it("provides valid default server environment variables", () => {
    expect(env.DATABASE_URL).toBeDefined();
    expect(env.REDIS_URL).toBeDefined();
    expect(env.BETTER_AUTH_SECRET).toBeDefined();
    expect(env.NODE_ENV).toBeDefined();
  });

  it("supports VERCEL_PROJECT_PRODUCTION_URL and VERCEL_URL as server environment variables", () => {
    expect("VERCEL_PROJECT_PRODUCTION_URL" in env).toBe(true);
    expect("VERCEL_URL" in env).toBe(true);
  });
});
