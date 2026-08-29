import { pool } from "@/db/client";

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`Timed out after ${ms}ms`);
      (error as NodeJS.ErrnoException).code = "ETIMEDOUT";
      reject(error);
    }, ms);
  });

  // query not cancellable; timeout releases caller only
  const raced = Promise.race([promise, timeoutPromise]) as Promise<T>;

  return raced.finally(() => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  });
}

export async function checkDbHealth(
  timeoutMs = 2000
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = performance.now();

  try {
    await withTimeout(pool.query("SELECT 1"), timeoutMs);
    const latencyMs = Math.round(performance.now() - start);
    return { latencyMs, ok: true };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);
    return { error: message, latencyMs, ok: false };
  }
}
