import redis from "../../../lib/redis.js";
import { logger } from "../../../config/logger.js";
import { calculateCacheTTL } from "./cache.helper.js";

export interface CachedUrlPayload {
  shortUrlId: string;
  originalUrl: string;
}

export const setUrlCache = async (
  key: string,
  data: CachedUrlPayload
): Promise<void> => {
  const ttl = calculateCacheTTL();
  await redis.set(key, JSON.stringify(data), "EX", ttl);

  logger.debug({
    event: "CACHE_SET",
    key,
    ttl,
  });
};

export const getUrlCache = async (
  key: string
): Promise<CachedUrlPayload | null> => {
  const data = await redis.get(key);
  if (!data) return null;

  try {
    return JSON.parse(data) as CachedUrlPayload;
  } catch (error) {
    logger.warn({
      event: "CACHE_DESERIALIZE_FAILED",
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
};

export const deleteUrlCache = async (key: string): Promise<void> => {
  await redis.del(key);

  logger.info({
    event: "CACHE_INVALIDATED",
    key,
  });
};
