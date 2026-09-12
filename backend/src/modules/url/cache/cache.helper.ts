import { env } from "../../../config/env.config.js";

export const calculateCacheTTL = (
  baseTTL: number = Number(env.URL_CACHE_TTL),
  jitterPercent: number = Number(env.JITTER_PERCENT)
): number => {
  const maxJitter = Math.floor(baseTTL * jitterPercent);
  const jitter = Math.floor(Math.random() * (maxJitter * 2 + 1)) - maxJitter;
  return Math.max(1, baseTTL + jitter);
};

export const getShortUrlCacheKey = (shortCode: string): string => {
  return `url:code:${shortCode}`;
};
