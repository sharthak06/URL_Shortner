import { ClickAnalytics } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/Errors/AppError.js";
import { IAnalyticsRepository } from "./analytics.interface.js";
import {
  RecordClickInput,
  ClickAnalyticsCursor,
  CountryStat,
  ReferrerStat,
} from "./analytics.types.js";

export class AnalyticsRepository implements IAnalyticsRepository {
  // 1. Atomic Ingestion: Inserts click record and increments clickCount
  async recordClick(data: RecordClickInput): Promise<ClickAnalytics | null> {
    try {
      const [click] = await prisma.$transaction([
        prisma.clickAnalytics.create({
          data: {
            shortUrlId: data.shortUrlId,
            ipAddress: data.ipAddress ?? null,
            userAgent: data.userAgent ?? null,
            referrer: data.referrer ?? null,
            country: data.country ?? null,
            clickedAt: data.clickedAt ?? new Date(),
          },
        }),
        prisma.shortURL.update({
          where: {
            id: data.shortUrlId,
          },
          data: {
            clickCount: {
              increment: 1,
            },
          },
        }),
      ]);

      return click;
    } catch (error: unknown) {
      // Prisma error codes:
      // P2003: Foreign key constraint failed on the field: `shortUrlId`
      // P2025: An operation failed because it depends on one or more records that were required but not found.
      // Indicates the short URL was deleted while the click was in-flight.
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error.code === "P2003" || error.code === "P2025")
      ) {
        return null;
      }

      throw error;
    }
  }

  // 2. Paginated Click Log using Composite Index [shortUrlId, clickedAt(Desc), id(Desc)]
  async findClicksByShortUrlId(
    shortUrlId: string,
    limit: number,
    cursor?: ClickAnalyticsCursor
  ): Promise<ClickAnalytics[]> {
    try {
      return await prisma.clickAnalytics.findMany({
        where: {
          shortUrlId,
        },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor.id } : undefined,
        orderBy: [{ clickedAt: "desc" }, { id: "desc" }],
      });
    } catch (error: unknown) {
      // P2025: Record to use for cursor not found (e.g. record deleted or stale client token)
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2025"
      ) {
        throw new AppError("Invalid or expired pagination cursor", 400);
      }

      throw error;
    }
  }

  // 3. Aggregate Total Click Count
  async getTotalClicksByShortUrlId(shortUrlId: string): Promise<number> {
    return await prisma.clickAnalytics.count({
      where: {
        shortUrlId,
      },
    });
  }

  // 4. Group by Country
  async getTopCountriesByShortUrlId(
    shortUrlId: string,
    limit: number = 5
  ): Promise<CountryStat[]> {
    const results = await prisma.clickAnalytics.groupBy({
      by: ["country"],
      where: {
        shortUrlId,
        country: {
          not: null,
        },
      },
      _count: {
        country: true,
      },
      orderBy: {
        _count: {
          country: "desc",
        },
      },
      take: limit,
    });

    return results.map((item) => ({
      country: item.country ?? "Unknown",
      clicks: item._count.country,
    }));
  }

  // 5. Group by Referrer
  async getTopReferrersByShortUrlId(
    shortUrlId: string,
    limit: number = 5
  ): Promise<ReferrerStat[]> {
    const results = await prisma.clickAnalytics.groupBy({
      by: ["referrer"],
      where: {
        shortUrlId,
        referrer: {
          not: null,
        },
      },
      _count: {
        referrer: true,
      },
      orderBy: {
        _count: {
          referrer: "desc",
        },
      },
      take: limit,
    });

    return results.map((item) => ({
      referrer: item.referrer ?? "Direct / None",
      clicks: item._count.referrer,
    }));
  }
}
