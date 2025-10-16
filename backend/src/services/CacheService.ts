import redisClient from "../config/redis";
import logger from "../utils/logger";
import { createHash } from "crypto";

interface CacheOptions {
  ttl?: number;
  prefix?: string;
  tags?: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
}

class CacheService {
  private defaultTTL: number = 3600;
  private prefix: string = "cache";

  private generateKey(key: string, prefix?: string): string {
    const cachePrefix = prefix || this.prefix;
    return `${cachePrefix}:${key}`;
  }

  private generateHashKey(data: any): string {
    const hash = createHash("md5");
    hash.update(JSON.stringify(data));
    return hash.digest("hex");
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const data = await redisClient.getJSON<T>(cacheKey);

      if (data) {
        await this.incrementStat("hits");
        logger.debug(`Cache HIT: ${cacheKey}`);
      } else {
        await this.incrementStat("misses");
        logger.debug(`Cache MISS: ${cacheKey}`);
      }

      return data;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const ttl = options?.ttl || this.defaultTTL;

      const success = await redisClient.setJSON(cacheKey, value, ttl);

      if (success && options?.tags) {
        await this.addTagsToKey(cacheKey, options.tags);
      }

      logger.debug(`Cache SET: ${cacheKey}, TTL: ${ttl}s`);

      return success;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T | null> {
    try {
      const cached = await this.get<T>(key, options);

      if (cached !== null) {
        return cached;
      }

      const data = await fetcher();

      if (data !== null && data !== undefined) {
        await this.set(key, data, options);
      }

      return data;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      return null;
    }
  }

  async del(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      return await redisClient.del(cacheKey);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async delPattern(pattern: string, options?: CacheOptions): Promise<number> {
    try {
      const fullPattern = this.generateKey(pattern, options?.prefix);
      return await redisClient.delPattern(fullPattern);
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      return await redisClient.exists(cacheKey);
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string, options?: CacheOptions): Promise<number> {
    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      return await redisClient.ttl(cacheKey);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  async expire(
    key: string,
    seconds: number,
    options?: CacheOptions
  ): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      return await redisClient.expire(cacheKey, seconds);
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  async mget<T>(keys: string[], options?: CacheOptions): Promise<(T | null)[]> {
    try {
      const cacheKeys = keys.map(key => this.generateKey(key, options?.prefix));
      const values = await Promise.all(
        cacheKeys.map(key => redisClient.getJSON<T>(key))
      );

      return values;
    } catch (error) {
      logger.error(`Cache mget error:`, error);
      return keys.map(() => null);
    }
  }

  async mset<T>(
    items: Array<{ key: string; value: T }>,
    options?: CacheOptions
  ): Promise<boolean> {
    try {
      const ttl = options?.ttl || this.defaultTTL;

      await Promise.all(
        items.map(item => this.set(item.key, item.value, { ...options, ttl }))
      );

      return true;
    } catch (error) {
      logger.error(`Cache mset error:`, error);
      return false;
    }
  }

  private async addTagsToKey(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        await redisClient.getClient().sadd(tagKey, key);
        await redisClient.expire(tagKey, 86400);
      }
    } catch (error) {
      logger.error(`Error adding tags to key ${key}:`, error);
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = `tag:${tag}`;
      const keys = await redisClient.getClient().smembers(tagKey);

      if (keys.length === 0) {
        return 0;
      }

      await Promise.all(keys.map(key => redisClient.del(key)));
      await redisClient.del(tagKey);

      logger.info(`Invalidated ${keys.length} cache entries with tag: ${tag}`);

      return keys.length;
    } catch (error) {
      logger.error(`Error invalidating by tag ${tag}:`, error);
      return 0;
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let totalInvalidated = 0;

    for (const tag of tags) {
      const count = await this.invalidateByTag(tag);
      totalInvalidated += count;
    }

    return totalInvalidated;
  }

  private async incrementStat(stat: "hits" | "misses"): Promise<void> {
    try {
      const key = `cache:stats:${stat}`;
      await redisClient.incr(key);
    } catch (error) {
      logger.error(`Error incrementing cache stat ${stat}:`, error);
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const hits = await redisClient.get("cache:stats:hits");
      const misses = await redisClient.get("cache:stats:misses");

      const hitsCount = parseInt(hits || "0", 10);
      const missesCount = parseInt(misses || "0", 10);
      const total = hitsCount + missesCount;

      const hitRate = total > 0 ? (hitsCount / total) * 100 : 0;

      const pattern = `${this.prefix}:*`;
      const keys = await redisClient.getClient().keys(pattern);

      return {
        hits: hitsCount,
        misses: missesCount,
        hitRate: Math.round(hitRate * 100) / 100,
        totalKeys: keys.length
      };
    } catch (error) {
      logger.error("Error getting cache stats:", error);

      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalKeys: 0
      };
    }
  }

  async clearStats(): Promise<void> {
    try {
      await redisClient.del("cache:stats:hits");
      await redisClient.del("cache:stats:misses");
      logger.info("Cache stats cleared");
    } catch (error) {
      logger.error("Error clearing cache stats:", error);
    }
  }

  async clear(options?: { prefix?: string }): Promise<number> {
    try {
      const pattern = options?.prefix
        ? `${options.prefix}:*`
        : `${this.prefix}:*`;

      const count = await redisClient.delPattern(pattern);

      logger.info(`Cleared ${count} cache entries with pattern: ${pattern}`);

      return count;
    } catch (error) {
      logger.error("Error clearing cache:", error);
      return 0;
    }
  }

  generateCacheKey(parts: any[]): string {
    const data = parts.map(part =>
      typeof part === "object" ? JSON.stringify(part) : String(part)
    );

    return data.join(":");
  }

  generateQueryCacheKey(
    model: string,
    query: any,
    params: any = {}
  ): string {
    const hash = this.generateHashKey({ query, params });
    return `${model}:query:${hash}`;
  }
}

const cacheService = new CacheService();

export default cacheService;
export { CacheService, CacheOptions, CacheStats };
