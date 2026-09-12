import { AppError } from "../../utils/Errors/AppError.js";
import {
  createShortCode,
  decodeCursor,
  encodeCursor,
  parseUrl,
} from "./url.helper.js";
import { IUrlRepository } from "./url.interface.js";
import { UpdateUrlInputType, UrlInputType } from "./url.schema.js";
import { PaginatedResponse } from "./url.types.js";
import { ShortURL } from "@prisma/client";
import { getShortUrlCacheKey } from "./cache/cache.helper.js";
import {
  getUrlCache,
  setUrlCache,
  deleteUrlCache,
} from "./cache/cache.service.js";
import { logger } from "../../config/logger.js";
import { bloomService } from "../bloom/bloom.container.js";

export class UrlService {
  // Dependency Inversion: depends on the interface contract
  constructor(private readonly urlRepo: IUrlRepository) {}

  // 1. Create a Short URL with Collision-Safe Retry Loop
  async createShortUrl(
    data: UrlInputType,
    userId: string
  ): Promise<ShortURL> {
    const parsedOriginalUrl = parseUrl(data.originalUrl);
    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const shortCode = createShortCode();

      // Check for collision before writing
      const existing = await this.urlRepo.findShortUrlByShortCode(shortCode);
      if (existing) {
        continue; // Collision detected, try generating a new code
      }

      const shortUrl = await this.urlRepo.createShortUrl({
        originalUrl: parsedOriginalUrl,
        userId,
        shortCode,
      });

      // Add shortCode to Bloom Filter after successful database creation
      try {
        await bloomService.add(shortCode);
        logger.info({
          event: "BLOOM_FILTER_UPDATED",
          shortCode,
        });
      } catch (error) {
        logger.warn({
          event: "BLOOM_FILTER_UPDATE_FAILED",
          shortCode,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      return shortUrl;
    }

    // Exhausted retries (extreme edge-case guard)
    throw new AppError(
      "Failed to generate a unique short code. Please try again.",
      500
    );
  }

  // 2. Fetch Destination for 302 Redirection (Cache-Aside Pattern)
  async getOriginalUrlFromShortCode(
    shortCode: string
  ): Promise<{ shortUrlId: string; originalUrl: string }> {
    // 1. Bloom Filter Check (Defends against Cache Penetration)
    let mightExist = true;
    try {
      mightExist = await bloomService.mightExist(shortCode);
    } catch (error) {
      logger.warn({
        event: "BLOOM_CHECK_FAILED_FAILING_OPEN",
        shortCode,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    if (!mightExist) {
      logger.info({
        event: "BLOOM_FILTER_NEGATIVE",
        shortCode,
      });
      throw new AppError("Short Url not found", 404);
    }

    logger.info({
      event: "BLOOM_FILTER_POSITIVE",
      shortCode,
    });

    const cacheKey = getShortUrlCacheKey(shortCode);

    // 2. Check Redis Cache
    const cachedUrl = await getUrlCache(cacheKey);
    if (cachedUrl) {
      logger.info({
        event: "CACHE_HIT",
        shortCode,
      });
      return cachedUrl;
    }

    logger.info({
      event: "CACHE_MISS",
      shortCode,
    });

    // 3. Query Database on Cache Miss
    const shortUrl = await this.urlRepo.findShortUrlByShortCode(shortCode);
    if (!shortUrl) {
      logger.warn({
        event: "BLOOM_FALSE_POSITIVE",
        shortCode,
      });
      throw new AppError("Short URL not found", 404);
    }

    const response = {
      shortUrlId: shortUrl.id,
      originalUrl: shortUrl.originalUrl,
    };

    // 4. Populate Redis Cache
    await setUrlCache(cacheKey, response);

    logger.info({
      event: "CACHE_REBUILT",
      shortCode,
    });

    return response;
  }

  // 3. High-Performance Cursor-Based Link Listing (Peek-Ahead Pattern)
  async getUserUrls(
    userId: string,
    limit: number = 10,
    cursor?: string
  ): Promise<PaginatedResponse<ShortURL>> {
    // Clamp limit between 1 and 100 to prevent database resource exhaustion
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    // Decode the base64 cursor token if the client provided one
    const decodedCursor = cursor ? decodeCursor(cursor) : undefined;

    // Fetch safeLimit + 1 rows from repository to peek ahead
    const urls = await this.urlRepo.findShortUrlsByUserId(
      userId,
      safeLimit + 1, // ✅ Fixed: peek 1 ahead to detect next page
      decodedCursor
    );

    // If DB returned more than safeLimit, there is at least one more page
    const hasMore = urls.length > safeLimit;

    // Discard the extra peek item from the items returned to the client
    const items = hasMore ? urls.slice(0, safeLimit) : urls;

    // Generate next cursor from the last item of the current page
    const nextCursor =
      hasMore && items.length > 0
        ? encodeCursor({
            createdAt: items[items.length - 1].createdAt,
            id: items[items.length - 1].id,
          })
        : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  // 4. Update Original URL (with Ownership Guard)
  async updateOriginalUrl(
    userId: string,
    shortCode: string,
    data: UpdateUrlInputType
  ): Promise<ShortURL> {
    const shortUrl = await this.urlRepo.findShortUrlByShortCode(shortCode);

    if (!shortUrl) {
      throw new AppError("Short URL not found", 404);
    }

    // Authorization Guard: Prevent users from modifying links they don't own
    if (shortUrl.userId !== userId) {
      throw new AppError("You are not allowed to perform this action", 403);
    }

    const parsedUpdateUrl = parseUrl(data.updatedOriginalUrl);

    const updatedShortUrl = await this.urlRepo.updateShortUrl(shortCode, {
      originalUrl: parsedUpdateUrl,
    });

    if (!updatedShortUrl) {
      throw new AppError("Failed to update short URL", 500);
    }

    // Update Redis cache with the new destination URL
    await setUrlCache(getShortUrlCacheKey(updatedShortUrl.shortCode), {
      shortUrlId: updatedShortUrl.id,
      originalUrl: updatedShortUrl.originalUrl,
    });

    return updatedShortUrl;
  }

  // 5. Delete Short URL (with Existence and Ownership Guards)
  async deleteShortUrl(userId: string, identifier: string): Promise<void> {
    // 1. Look up by shortCode first
    let shortUrl = await this.urlRepo.findShortUrlByShortCode(identifier);

    // 2. If not found by shortCode, check if identifier matches cuid id
    if (!shortUrl) {
      shortUrl = await this.urlRepo.findShortUrlByIdAndUserId(identifier, userId);
    }

    if (!shortUrl) {
      throw new AppError("Short URL not found", 404);
    }

    // 3. Authorization Guard: Prevent users from deleting links they don't own
    if (shortUrl.userId !== userId) {
      throw new AppError("You are not allowed to perform this action", 403);
    }

    // 4. Delete the URL from database
    await this.urlRepo.deleteShortUrl(shortUrl.shortCode);

    // Invalidate Redis cache
    await deleteUrlCache(getShortUrlCacheKey(shortUrl.shortCode));
  }
}
