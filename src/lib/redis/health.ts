import { getRedis } from "@/lib/redis";

export async function checkRedisHealth(
  timeoutMs = 2000
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();

  try {
    const client = getRedis();

    const timeoutError = new Error(
      `ETIMEDOUT: Redis ping timed out after ${timeoutMs}ms`
    );
    // Assign code for downstream error handling consistency
    (timeoutError as NodeJS.ErrnoException).code = "ETIMEDOUT";

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => reject(timeoutError), timeoutMs);
      // Allow Node to exit if this is the only timer left
      if (
        typeof (timer as NodeJS.Timeout & { unref?: () => void }).unref ===
        "function"
      ) {
        (timer as NodeJS.Timeout & { unref: () => void }).unref();
      }
    });

    const result = await Promise.race([client.ping(), timeoutPromise]);

    const latencyMs = Date.now() - start;

    // ioredis ping returns "PONG" on success
    if (result === "PONG") {
      return { latencyMs, ok: true };
    }

    // If ping returns something unexpected but didn't throw, treat as healthy
    return { latencyMs, ok: true };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const error = toErrorString(err);
    return { error, latencyMs, ok: false };
  }
}

function toErrorString(err: unknown): string {
  if (err instanceof Error) {
    const { code } = err as NodeJS.ErrnoException;
    // Include code in message if present and not already included
    if (code && !err.message.includes(code)) {
      return `${code}: ${err.message}`;
    }
    return err.message;
  }
  return String(err);
}
