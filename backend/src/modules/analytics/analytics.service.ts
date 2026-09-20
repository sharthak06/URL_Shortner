import { IAnalyticsRepository } from "./analytics.interface.js";
import { IUrlRepository } from "../url/url.interface.js";
import { RecordClickInput, AnalyticsSummaryResponse } from "./analytics.types.js";
import { decodeAnalyticsCursor, encodeAnalyticsCursor } from "./analytics.helper.js";
import { AppError } from "../../utils/Errors/AppError.js";
import { logger } from "../../config/logger.js";

export class AnalyticsService {
  constructor(
    private readonly analyticsRepo: IAnalyticsRepository,
    private readonly urlRepo: IUrlRepository
  ) {}

  // 1. Ingestion: Consumed by BullMQ Background Worker
  async recordClick(
    data: RecordClickInput
  ): Promise<{ recorded: boolean; clickId?: string }> {
    const click = await this.analyticsRepo.recordClick(data);

    if (!click) {
      logger.warn({
        event: "ORPHAN_CLICK_DISCARDED",
        shortUrlId: data.shortUrlId,
        message:
          "Target short URL was deleted before click ingestion. Discarded without retrying.",
      });
      return { recorded: false };
    }

    logger.info({
      event: "CLICK_RECORDED",
      clickId: click.id,
      shortUrlId: data.shortUrlId,
    });

    return { recorded: true, clickId: click.id };
  }

  // 2. Querying: Consumed by protected API route with IDOR defense
  async getLinkAnalytics(
    userId: string,
    identifier: string,
    limit: number = 10,
    cursor?: string
  ): Promise<AnalyticsSummaryResponse> {
    // IDOR Defense: Verify requesting user owns this short URL
    // Supports querying by database CUID or shortCode
    let shortUrl = await this.urlRepo.findShortUrlByIdAndUserId(
      identifier,
      userId
    );

    if (!shortUrl) {
      const byCode = await this.urlRepo.findShortUrlByShortCode(identifier);
      if (byCode && byCode.userId === userId) {
        shortUrl = byCode;
      }
    }

    if (!shortUrl) {
      throw new AppError(
        "Short URL not found or you do not have permission to view its analytics",
        404
      );
    }

    const resolvedUrlId = shortUrl.id;

    // Clamp pagination limit between 1 and 100
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const decodedCursor = cursor ? decodeAnalyticsCursor(cursor) : undefined;

    // Total clicks is already in memory on shortUrl from the ownership check
    const totalClicks = shortUrl.clickCount;

    // Concurrently fetch clicks (peek 1 ahead) and top rankings
    const [clicks, topCountries, topReferrers] = await Promise.all([
      this.analyticsRepo.findClicksByShortUrlId(
        resolvedUrlId,
        safeLimit + 1,
        decodedCursor
      ),
      this.analyticsRepo.getTopCountriesByShortUrlId(resolvedUrlId, 5),
      this.analyticsRepo.getTopReferrersByShortUrlId(resolvedUrlId, 5),
    ]);

    // Peek-ahead pagination evaluation
    const hasMore = clicks.length > safeLimit;
    const items = hasMore ? clicks.slice(0, safeLimit) : clicks;

    const nextCursor =
      hasMore && items.length > 0
        ? encodeAnalyticsCursor({
            clickedAt: items[items.length - 1].clickedAt,
            id: items[items.length - 1].id,
          })
        : null;

    return {
      shortUrlId: resolvedUrlId,
      totalClicks,
      topCountries,
      topReferrers,
      clicks: {
        items,
        nextCursor,
        hasMore,
      },
    };
  }
}
