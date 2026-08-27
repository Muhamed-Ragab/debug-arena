import { Redis } from "ioredis";
import { env } from "@/lib/env/env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis(): Redis {
  if (!globalForRedis.redis) {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 5) {
          return null;
        }
        return Math.min(times * 100, 2000);
      },
    });

    client.on("error", (err: NodeJS.ErrnoException) => {
      if (process.env.NODE_ENV === "test") {
        return;
      }
      const code =
        err.code ??
        (err as { errors?: Array<{ code?: string }> }).errors?.[0]?.code;
      if (code === "ECONNREFUSED") {
        console.warn(
          "[Redis] not reachable — is Docker running? (REDIS_URL=%s)",
          env.REDIS_URL
        );
      } else {
        console.warn("[Redis] error:", err.message);
      }
    });

    globalForRedis.redis = client;
  }
  return globalForRedis.redis;
}
