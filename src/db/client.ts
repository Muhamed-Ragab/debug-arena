import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../lib/env/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

/**
 * Normalize Postgres connection string to use sslmode=verify-full.
 * Opt-in via DB_SSL_VERIFY=full to avoid breaking deploys without CA.
 * Uses URL API for unicode-safe, spec-compliant query param handling.
 * Falls back to string replace for non-standard URLs (e.g., missing protocol).
 * See: https://www.postgresql.org/docs/current/libpq-ssl.html
 */
export function normalizeConnectionString(url: string): string {
  // verify-full requires CA provisioning; opt-in prevents surprise handshake failures
  if (env.DB_SSL_VERIFY !== "full") {
    return url;
  }
  try {
    const parsed = new URL(url);
    const mode = parsed.searchParams.get("sslmode");
    if (mode === "require" || mode === "prefer" || mode === "verify-ca") {
      parsed.searchParams.set("sslmode", "verify-full");
      return parsed.toString();
    }
    return url;
  } catch {
    return url.replace(
      /sslmode=(require|prefer|verify-ca)/,
      "sslmode=verify-full",
    );
  }
}

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: normalizeConnectionString(env.DATABASE_URL),
    idleTimeoutMillis: 30_000,
    keepAlive: true,
    max: 10,
  });

pool.on("error", err => {
  console.warn("[DB] pool error (connection lost, will retry):", err.message);
});

if (env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });
