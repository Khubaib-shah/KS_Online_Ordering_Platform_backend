// ─── Cache-Aside Helpers ────────────────────────────────────────────

import { getRedisClient } from '../config/redis';

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get-or-set: returns cached value or fetches, caches, and returns it.
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  try {
    const redis = await getRedisClient();
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const data = await fetcher();
    await redis.setEx(key, ttl, JSON.stringify(data));
    return data;
  } catch {
    // If Redis is down, fall through to the fetcher
    return fetcher();
  }
}

/**
 * Invalidate a specific cache key.
 */
export async function cacheInvalidate(key: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.del(key);
  } catch {
    // Redis down — silently ignore, data is still correct from DB
  }
}

/**
 * Invalidate all keys matching a pattern (tag-based invalidation).
 * Example: invalidateByTag('tenant:abc123:*') clears all cached data for that tenant.
 */
export async function cacheInvalidateByTag(pattern: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch {
    // Redis down — silently ignore
  }
}
