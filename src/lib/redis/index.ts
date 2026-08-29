import { Redis } from "ioredis";
import { env } from "@/lib/env/env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis(): Redis {
  if (!globalForRedis.redis) {
    const client = new Redis(env.REDIS_URL, {
      // enableReadyCheck ensures Redis is ready before commands; lazyConnect:false connects immediately
      // retryStrategy: exponential backoff capped at 3s; reconnectOnError handles transient READONLY etc.
      // maxRetriesPerRequest:null lets ioredis throw MaxRetriesPerRequestError on queue overflow,
      // which offline detection maps to OfflineError (see src/lib/offline/errors.ts).
      enableReadyCheck: true,
      lazyConnect: false,
      maxRetriesPerRequest: null,
      reconnectOnError: () => 1,
      retryStrategy: (times) => Math.min(times * 200, 3000),
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
