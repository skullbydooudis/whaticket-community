import Redis from "ioredis";
import logger from "../utils/logger";

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryStrategy?: (times: number) => number | null;
  maxRetriesPerRequest: number;
  enableReadyCheck: boolean;
  enableOfflineQueue: boolean;
}

const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0", 10),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

class RedisClient {
  private client: Redis;
  private subscriber: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on("connect", () => {
      logger.info("Redis client connected");
      this.isConnected = true;
    });

    this.client.on("error", (error) => {
      logger.error("Redis client error:", error);
      this.isConnected = false;
    });

    this.client.on("close", () => {
      logger.warn("Redis client connection closed");
      this.isConnected = false;
    });

    this.subscriber.on("connect", () => {
      logger.info("Redis subscriber connected");
    });

    this.subscriber.on("error", (error) => {
      logger.error("Redis subscriber error:", error);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  isReady(): boolean {
    return this.isConnected && this.client.status === "ready";
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(
    key: string,
    value: string,
    expirationInSeconds?: number
  ): Promise<boolean> {
    try {
      if (expirationInSeconds) {
        await this.client.setex(key, expirationInSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async setJSON(
    key: string,
    value: any,
    expirationInSeconds?: number
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      return await this.set(key, serialized, expirationInSeconds);
    } catch (error) {
      logger.error(`Redis SET JSON error for key ${key}:`, error);
      return false;
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const data = await this.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Redis GET JSON error for key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      const pipeline = this.client.pipeline();
      keys.forEach(key => pipeline.del(key));
      await pipeline.exec();

      return keys.length;
    } catch (error) {
      logger.error(`Redis DEL pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async incr(key: string): Promise<number | null> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, error);
      return null;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Redis TTL error for key ${key}:`, error);
      return -1;
    }
  }

  async hset(hash: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hset(hash, field, value);
      return true;
    } catch (error) {
      logger.error(`Redis HSET error for hash ${hash}:`, error);
      return false;
    }
  }

  async hget(hash: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(hash, field);
    } catch (error) {
      logger.error(`Redis HGET error for hash ${hash}:`, error);
      return null;
    }
  }

  async hgetall(hash: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(hash);
    } catch (error) {
      logger.error(`Redis HGETALL error for hash ${hash}:`, error);
      return {};
    }
  }

  async hdel(hash: string, field: string): Promise<boolean> {
    try {
      await this.client.hdel(hash, field);
      return true;
    } catch (error) {
      logger.error(`Redis HDEL error for hash ${hash}:`, error);
      return false;
    }
  }

  async lpush(key: string, value: string): Promise<number | null> {
    try {
      return await this.client.lpush(key, value);
    } catch (error) {
      logger.error(`Redis LPUSH error for key ${key}:`, error);
      return null;
    }
  }

  async rpush(key: string, value: string): Promise<number | null> {
    try {
      return await this.client.rpush(key, value);
    } catch (error) {
      logger.error(`Redis RPUSH error for key ${key}:`, error);
      return null;
    }
  }

  async lpop(key: string): Promise<string | null> {
    try {
      return await this.client.lpop(key);
    } catch (error) {
      logger.error(`Redis LPOP error for key ${key}:`, error);
      return null;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rpop(key);
    } catch (error) {
      logger.error(`Redis RPOP error for key ${key}:`, error);
      return null;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      logger.error(`Redis LRANGE error for key ${key}:`, error);
      return [];
    }
  }

  async zadd(
    key: string,
    score: number,
    member: string
  ): Promise<number | null> {
    try {
      return await this.client.zadd(key, score, member);
    } catch (error) {
      logger.error(`Redis ZADD error for key ${key}:`, error);
      return null;
    }
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.zrange(key, start, stop);
    } catch (error) {
      logger.error(`Redis ZRANGE error for key ${key}:`, error);
      return [];
    }
  }

  async zrangebyscore(
    key: string,
    min: number,
    max: number
  ): Promise<string[]> {
    try {
      return await this.client.zrangebyscore(key, min, max);
    } catch (error) {
      logger.error(`Redis ZRANGEBYSCORE error for key ${key}:`, error);
      return [];
    }
  }

  async zrem(key: string, member: string): Promise<number | null> {
    try {
      return await this.client.zrem(key, member);
    } catch (error) {
      logger.error(`Redis ZREM error for key ${key}:`, error);
      return null;
    }
  }

  async flushdb(): Promise<boolean> {
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error("Redis FLUSHDB error:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      await this.subscriber.quit();
      logger.info("Redis connections closed");
    } catch (error) {
      logger.error("Error disconnecting Redis:", error);
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch (error) {
      logger.error("Redis PING error:", error);
      return false;
    }
  }
}

const redisClient = new RedisClient();

export default redisClient;
export { RedisClient };
