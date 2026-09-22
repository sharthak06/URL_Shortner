import { Request, Response, NextFunction } from "express";
import redis from "../../lib/redis.js";
import { env } from "../../config/env.config.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../utils/Errors/AppError.js";
import { TokenBucketType } from "./types.js";

/**
 * Tier 3: Token Bucket Rate Limiter for URL Creation
 * Permits bursts (e.g. 10 links) while strictly capping sustained creation rate (1 token per 2s).
 * Scoped per authenticated user (`req.user.userId`).
 */
export const shortUrlTokenBucketRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;
  if (!userId) {
    return next(new AppError("Authentication required for link creation", 401));
  }

  const key = `token-bucket:${userId}`;
  const now = Date.now();
  const capacity = env.SHORT_URL_TOKEN_BUCKET_CAPACITY;
  const refillRate = env.SHORT_URL_TOKEN_REFILL_RATE;
  const refillInterval = env.SHORT_URL_TOKEN_REFILL_INTERVAL;

  try {
    const rawBucket = await redis.get(key);
    let bucket: TokenBucketType;

    if (rawBucket) {
      try {
        bucket = JSON.parse(rawBucket) as TokenBucketType;
      } catch {
        bucket = { tokens: capacity, lastRefill: now };
      }

      // 1. Calculate elapsed time since last refill calculation
      const elapsed = Math.max(0, now - bucket.lastRefill);

      // 2. Determine how many tokens should be refilled
      const refillCount = Math.floor(elapsed / refillInterval);

      if (refillCount > 0) {
        // 3. Replenish tokens up to capacity
        bucket.tokens = Math.min(capacity, bucket.tokens + refillCount * refillRate);

        // Advance lastRefill by refilled intervals (or reset to now if bucket full)
        if (bucket.tokens >= capacity) {
          bucket.lastRefill = now;
        } else {
          bucket.lastRefill += refillCount * refillInterval;
        }
      }
    } else {
      // Initialize fresh bucket at full capacity
      bucket = {
        tokens: capacity,
        lastRefill: now,
      };
    }

    // 4. Check if tokens are available
    if (bucket.tokens <= 0) {
      const timeToNextRefill = Math.max(0, refillInterval - (now - bucket.lastRefill));
      const retryAfterSeconds = Math.max(1, Math.ceil(timeToNextRefill / 1000));

      res.setHeader("Retry-After", retryAfterSeconds);
      res.setHeader("X-RateLimit-Limit", capacity);
      res.setHeader("X-RateLimit-Remaining", 0);

      logger.warn({
        event: "SHORT_URL_RATE_LIMIT_EXCEEDED",
        userId,
        retryAfterSeconds,
        message: "URL creation token bucket exhausted",
      });

      // Persist state in Redis with 1-hour TTL
      await redis.set(key, JSON.stringify(bucket), "EX", 3600);

      return res.status(429).json({
        success: false,
        message: "Too many URL creation requests. Burst limit reached. Please wait before creating more links.",
      });
    }

    // 5. Deduct token and persist
    bucket.tokens -= 1;
    await redis.set(key, JSON.stringify(bucket), "EX", 3600);

    res.setHeader("X-RateLimit-Limit", capacity);
    res.setHeader("X-RateLimit-Remaining", bucket.tokens);

    return next();
  } catch (error) {
    logger.error({
      event: "SHORT_URL_RATE_LIMIT_ERROR",
      userId,
      error: error instanceof Error ? error.message : error,
    });
    return next(error);
  }
};

// Alias for convenience / typo-tolerance
export const shortUrlTokenBuckerRateLimit = shortUrlTokenBucketRateLimit;
