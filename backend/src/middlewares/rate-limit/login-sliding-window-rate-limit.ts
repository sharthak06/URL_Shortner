import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import redis from "../../lib/redis.js";
import { env } from "../../config/env.config.js";
import { logger } from "../../config/logger.js";

/**
 * Tier 2: Sliding Window Log Rate Limiter for Login
 * Uses Redis Sorted Sets (ZSET) to prevent boundary attacks on credential verification.
 */
export const loginSlidingWindowRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  const key = `login-rate-limit:${clientIp}`;
  const windowMs = env.LOGIN_RATE_LIMIT_WINDOW * 60 * 1000;
  const maxAttempts = env.LOGIN_RATE_LIMIT_SIZE;
  const windowSeconds = Math.ceil(windowMs / 1000);
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // 1. Prune expired attempts outside the rolling window
    await redis.zremrangebyscore(key, 0, windowStart);

    // 2. Count remaining attempts in current rolling window
    const currentAttempts = await redis.zcard(key);

    // 3. Reject if limit reached
    if (currentAttempts >= maxAttempts) {
      logger.warn({
        event: "LOGIN_RATE_LIMIT_EXCEEDED",
        ip: clientIp,
        attempts: currentAttempts,
        maxAttempts,
        message: "Login rate limit exceeded",
      });

      res.setHeader("Retry-After", windowSeconds);
      return res.status(429).json({
        success: false,
        message: `Too many login attempts from this IP. Please try again after ${env.LOGIN_RATE_LIMIT_WINDOW} minutes.`,
      });
    }

    // 4. Record the current attempt
    const member = `${now}-${randomUUID()}`;
    await redis.zadd(key, now, member);

    // 5. Reset rolling expiration
    await redis.expire(key, windowSeconds);

    return next();
  } catch (error) {
    logger.error({
      event: "LOGIN_RATE_LIMIT_ERROR",
      ip: clientIp,
      error: error instanceof Error ? error.message : error,
    });
    return next(error);
  }
};
