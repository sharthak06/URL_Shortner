import { Request, Response, NextFunction } from "express";
import redis from "../../lib/redis.js";
import { env } from "../../config/env.config.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../utils/Errors/AppError.js";

const BUCKET_TTL_SECONDS = 3600;

// Atomic refill + check + deduct + persist. Runs as one Redis operation, so concurrent
// requests from the same user can't all read the same token count and each spend it
// (which a separate GET -> compute in Node -> SET allowed). The bucket is stored as
// JSON {tokens, lastRefill}; a missing or corrupt value starts a full bucket.
// Returns { allowed (1|0), tokens remaining, lastRefill (ms) }.
const TOKEN_BUCKET_LUA_SCRIPT = `
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local refillInterval = tonumber(ARGV[3])
local now = tonumber(ARGV[4])
local ttl = tonumber(ARGV[5])

local tokens = capacity
local lastRefill = now

local raw = redis.call("GET", KEYS[1])
if raw then
    local ok, bucket = pcall(cjson.decode, raw)
    if ok and type(bucket) == "table" and tonumber(bucket.tokens) and tonumber(bucket.lastRefill) then
        tokens = tonumber(bucket.tokens)
        lastRefill = tonumber(bucket.lastRefill)

        local refillCount = math.floor(math.max(0, now - lastRefill) / refillInterval)
        if refillCount > 0 then
            tokens = math.min(capacity, tokens + refillCount * refillRate)
            if tokens >= capacity then
                lastRefill = now
            else
                lastRefill = lastRefill + refillCount * refillInterval
            end
        end
    end
end

local allowed = 0
if tokens > 0 then
    tokens = tokens - 1
    allowed = 1
end

redis.call("SET", KEYS[1], cjson.encode({ tokens = tokens, lastRefill = lastRefill }), "EX", ttl)
return { allowed, tokens, lastRefill }
`;

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
    const [allowed, tokensLeft, lastRefill] = (await redis.eval(
      TOKEN_BUCKET_LUA_SCRIPT,
      1,
      key,
      capacity,
      refillRate,
      refillInterval,
      now,
      BUCKET_TTL_SECONDS
    )) as [number, number, number];

    if (allowed !== 1) {
      const timeToNextRefill = Math.max(0, refillInterval - (now - lastRefill));
      const retryAfterSeconds = Math.max(1, Math.ceil(timeToNextRefill / 1000));

      res.setHeader("Retry-After", retryAfterSeconds);
      res.setHeader("X-RateLimit-Limit", capacity);
      res.setHeader("X-RateLimit-Remaining", 0);

      logger.warn({
        event: "SHORT_URL_RATE_LIMIT_EXCEEDED",
        userId,
        retryAfterSeconds,
        retryAfterMs: timeToNextRefill,
        message: "URL creation token bucket exhausted",
      });

      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        retryAfterMs: timeToNextRefill,
        message: "Too many URL creation requests. Burst limit reached. Please wait before creating more links.",
      });
    }

    res.setHeader("X-RateLimit-Limit", capacity);
    res.setHeader("X-RateLimit-Remaining", tokensLeft);

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
