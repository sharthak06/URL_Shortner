import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { Request, Response, NextFunction } from "express";
import redis from "../../lib/redis.js";
import { env } from "../../config/env.config.js";
import { logger } from "../../config/logger.js";

export const globalRateLimiter = rateLimit({
  windowMs: env.GLOBAL_RATE_LIMIT_WINDOW * 60 * 1000,
  limit: env.GLOBAL_RATE_LIMIT_SIZE,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - ioredis returns unknown / ioredis specific reply, compatible with RedisReply
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: "rate-limit:global:",
  }),
  skip: (req: Request) => {
    // Health check endpoints are excluded from global rate limiting
    return req.path === "/health" || req.path === "/api/v1/health";
  },
  handler: (req: Request, res: Response, _next: NextFunction) => {
    logger.warn({
      event: "GLOBAL_RATE_LIMIT_EXCEEDED",
      ip: req.ip,
      method: req.method,
      path: req.originalUrl,
      message: "Global rate limit exceeded",
    });

    return res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later.",
    });
  },
});
