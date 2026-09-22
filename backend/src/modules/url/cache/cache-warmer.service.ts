import redis from "../../../lib/redis.js";
import { logger } from "../../../config/logger.js";
import { env } from "../../../config/env.config.js";
import { IUrlRepository } from "../url.interface.js";
import { getShortUrlCacheKey } from "./cache.helper.js";
import { CachedUrlPayload } from "./cache.service.js";

export class CacheWarmerService {
  constructor(private readonly urlRepo: IUrlRepository) {}

  /**
   * Fetches top N most-clicked short links and batch populates Redis
   * with an extended TTL (e.g. 24 hours) via a pipelined command.
   */
  async warmHotUrls(limit: number): Promise<{ warmedCount: number }> {
    logger.info({
      event: "CACHE_WARMING_STARTED",
      limit,
    });

    try {
      const hotUrls = await this.urlRepo.findTopHotUrls(limit);

      if (!hotUrls || hotUrls.length === 0) {
        logger.info({
          event: "NO_HOT_URLS_TO_WARM",
        });
        return { warmedCount: 0 };
      }

      const ttlSeconds = Number(env.HOT_URL_CACHE_TTL_HOURS || 24) * 3600;
      const pipeline = redis.pipeline();

      for (const url of hotUrls) {
        const cacheKey = getShortUrlCacheKey(url.shortCode);
        const payload: CachedUrlPayload = {
          shortUrlId: url.id,
          originalUrl: url.originalUrl,
        };

        pipeline.set(cacheKey, JSON.stringify(payload), "EX", ttlSeconds);
      }

      const results = await pipeline.exec();

      // Verify pipeline execution results
      let successCount = 0;
      if (results) {
        for (const [err] of results) {
          if (!err) {
            successCount++;
          } else {
            logger.warn({
              event: "CACHE_WARMER_PIPELINE_ITEM_FAILED",
              error: err.message,
            });
          }
        }
      }

      logger.info({
        event: "CACHE_WARMING_COMPLETED",
        totalFetched: hotUrls.length,
        warmedCount: successCount,
        ttlSeconds,
      });

      return { warmedCount: successCount };
    } catch (error) {
      logger.error({
        event: "CACHE_WARMING_FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
