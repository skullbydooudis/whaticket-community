import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis";
import AppError from "../errors/AppError";
import logger from "../utils/logger";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
}

const defaultKeyGenerator = (req: Request): string => {
  const userId = req.user?.id;
  const ip = req.ip || req.connection.remoteAddress;
  return userId ? `user:${userId}` : `ip:${ip}`;
};

class RateLimiter {
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      message: config.message || "Too many requests, please try again later",
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      keyGenerator: config.keyGenerator || defaultKeyGenerator
    };
  }

  middleware() {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        if (!redisClient.isReady()) {
          logger.warn("Redis not available, rate limiting bypassed");
          return next();
        }

        const key = this.config.keyGenerator(req);
        const rateLimitKey = `ratelimit:${req.path}:${key}`;

        const info = await this.checkRateLimit(rateLimitKey);

        res.setHeader("X-RateLimit-Limit", info.limit);
        res.setHeader("X-RateLimit-Remaining", Math.max(0, info.remaining));
        res.setHeader("X-RateLimit-Reset", info.resetTime);

        if (info.remaining < 0) {
          const retryAfter = Math.ceil((info.resetTime - Date.now()) / 1000);
          res.setHeader("Retry-After", retryAfter);

          logger.warn(`Rate limit exceeded for key: ${key} on ${req.path}`);

          throw new AppError(this.config.message, 429);
        }

        if (!this.config.skipSuccessfulRequests) {
          res.on("finish", () => {
            if (
              this.config.skipFailedRequests &&
              res.statusCode >= 400
            ) {
              return;
            }
            this.incrementCounter(rateLimitKey).catch(error => {
              logger.error("Error incrementing rate limit counter:", error);
            });
          });
        } else {
          res.on("finish", () => {
            if (res.statusCode < 400) {
              return;
            }
            this.incrementCounter(rateLimitKey).catch(error => {
              logger.error("Error incrementing rate limit counter:", error);
            });
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  private async checkRateLimit(key: string): Promise<RateLimitInfo> {
    const current = await redisClient.get(key);
    const ttl = await redisClient.ttl(key);

    const currentCount = current ? parseInt(current, 10) : 0;
    const resetTime =
      ttl > 0
        ? Date.now() + ttl * 1000
        : Date.now() + this.config.windowMs;

    return {
      limit: this.config.maxRequests,
      current: currentCount,
      remaining: this.config.maxRequests - currentCount,
      resetTime
    };
  }

  private async incrementCounter(key: string): Promise<void> {
    const exists = await redisClient.exists(key);

    if (!exists) {
      await redisClient.set(
        key,
        "1",
        Math.ceil(this.config.windowMs / 1000)
      );
    } else {
      await redisClient.incr(key);
    }
  }

  async reset(identifier: string): Promise<void> {
    const pattern = `ratelimit:*:${identifier}`;
    await redisClient.delPattern(pattern);
  }

  async getRateLimitInfo(
    path: string,
    identifier: string
  ): Promise<RateLimitInfo | null> {
    const key = `ratelimit:${path}:${identifier}`;
    return await this.checkRateLimit(key);
  }
}

export const createRateLimiter = (config: RateLimitConfig) => {
  return new RateLimiter(config);
};

export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 1000,
  message: "Too many requests from this IP, please try again after 15 minutes"
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: "Too many authentication attempts, please try again later",
  skipSuccessfulRequests: true
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 100,
  message: "API rate limit exceeded, please try again later"
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: "Too many requests, please slow down"
});

export default RateLimiter;
export { RateLimitConfig, RateLimitInfo };
