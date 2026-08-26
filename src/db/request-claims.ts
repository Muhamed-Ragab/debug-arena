import { sql } from "drizzle-orm";
import { db } from "./client";

type TransactionFn = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Runs `fn` inside a transaction whose GUC `request.jwt.claim.sub` equals userId.
 * SET LOCAL scope dies with the transaction — pooled connections cannot leak identity.
 */
export function withRequestClaims<T>(
  userId: string,
  _role: string | null | undefined,
  fn: (tx: TransactionFn) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('request.jwt.claim.sub', ${userId}, true)`
    );
    return fn(tx);
  });
}
