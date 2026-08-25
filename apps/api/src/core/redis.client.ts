import { Redis, type RedisOptions } from "ioredis";

let singleton: Redis | null = null;

export function createRedisClient(options: Partial<RedisOptions> = {}): Redis {
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    connectionName: "debug-arena-api",
    // Bounded retries so transient Redis outages surface as errors instead of
    // hanging request handlers forever. Blocking consumers (future BullMQ
    // workers) must override maxRetriesPerRequest: null via this factory.
    maxRetriesPerRequest: 20,
    retryStrategy: (times) => Math.min(times * 200, 5000),
    ...options,
  });
}

/** Process-wide shared connection (better-auth secondaryStorage, caches, ...). */
export function getRedis(): Redis {
  singleton ??= createRedisClient();
  return singleton;
}
