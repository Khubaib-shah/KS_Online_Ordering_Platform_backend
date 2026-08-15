import { createClient, RedisClientType } from 'redis';
import { env } from './env';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!env.REDIS_URL) {
    throw new Error('REDIS_URL is not set, skipping Redis cache');
  }

  if (!redisClient) {
    redisClient = createClient({ url: env.REDIS_URL }) as RedisClientType;
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    await redisClient.connect();
    console.log('✅ Redis connected');
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
