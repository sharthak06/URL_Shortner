import { IUrlRepository } from "./url.interface.js";
import { prisma } from "../../lib/prisma.js";
import { CreateShortUrlType, UpdateShortUrlType, UrlCursor, UserUrlStats } from "./url.types.js";
import { ShortURL } from "@prisma/client";

export class UrlRepository implements IUrlRepository {
  async createShortUrl(data: CreateShortUrlType): Promise<ShortURL> {
    return await prisma.shortURL.create({
      data,
    });
  }

  async findShortUrlByShortCode(shortCode: string): Promise<ShortURL | null> {
    return await prisma.shortURL.findUnique({
      where: {
        shortCode,
      },
    });
  }

  async findShortUrlByIdAndUserId(
    id: string,
    userId: string
  ): Promise<ShortURL | null> {
    return await prisma.shortURL.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async findShortUrlsByUserId(
    userId: string,
    limit: number,
    cursor?: UrlCursor,
    search?: string
  ): Promise<ShortURL[]> {
    return await prisma.shortURL.findMany({
      where: {
        userId,
        // Scoped to one user first (indexed), then a case-insensitive substring match
        ...(search
          ? {
              OR: [
                { originalUrl: { contains: search, mode: "insensitive" as const } },
                { shortCode: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor.id } : undefined,
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });
  }

  async updateShortUrl(
    shortCode: string,
    data: UpdateShortUrlType
  ): Promise<ShortURL | null> {
    return await prisma.shortURL.update({
      where: {
        shortCode,
      },
      data,
    });
  }

  async deleteShortUrl(shortCode: string): Promise<ShortURL> {
    return await prisma.shortURL.delete({
      where: {
        shortCode,
      },
    });
  }

  async getUserUrlStats(userId: string): Promise<UserUrlStats> {
    // One round trip: both reads ride the (userId, ...) index
    const [aggregate, topLink] = await prisma.$transaction([
      prisma.shortURL.aggregate({
        where: { userId },
        _count: { _all: true },
        _sum: { clickCount: true },
      }),
      prisma.shortURL.findFirst({
        where: { userId, clickCount: { gt: 0 } },
        orderBy: [{ clickCount: "desc" }, { createdAt: "desc" }],
        select: { id: true, shortCode: true, originalUrl: true, clickCount: true },
      }),
    ]);

    return {
      totalLinks: aggregate._count._all,
      totalClicks: aggregate._sum.clickCount ?? 0,
      topLink,
    };
  }

  async findTopHotUrls(limit: number): Promise<ShortURL[]> {
    return await prisma.shortURL.findMany({
      orderBy: {
        clickCount: "desc",
      },
      take: limit,
    });
  }
}
  