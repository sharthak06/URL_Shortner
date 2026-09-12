import { IUrlRepository } from "./url.interface.js";
import { prisma } from "../../lib/prisma.js";
import { CreateShortUrlType, UpdateShortUrlType, UrlCursor } from "./url.types.js";
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
    cursor?: UrlCursor
  ): Promise<ShortURL[]> {
    return await prisma.shortURL.findMany({
      where: {
        userId,
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
}
  