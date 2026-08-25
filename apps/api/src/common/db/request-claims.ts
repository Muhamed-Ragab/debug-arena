import { sql } from "drizzle-orm";
import { db } from "../../core";

type TransactionFn = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Runs `fn` inside a transaction whose RLS identity is pinned to the given
 * user. Matches the policies encoded in packages/db/src/schema.ts, which read
 * current_setting('request.jwt.claim.sub')::uuid (scalar GUC, NOT the JSON
 * variant sketched in implementation_guide.md §6).
 *
 * set_config(..., true) == SET LOCAL: the claim dies with the transaction,
 * so pooled connections can never leak identity across requests.
 */
export async function withRequestClaims<T>(
  userId: string,
  role: string | null,
  fn: (tx: TransactionFn) => Promise<T>,
): Promise<T> {
  void role; // reserved: future policies may add request.jwt.claim.role
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('request.jwt.claim.sub', ${userId}, true)`);
    return fn(tx);
  });
}
