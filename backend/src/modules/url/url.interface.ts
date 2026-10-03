import { ShortURL } from "@prisma/client";
import { CreateShortUrlType, UpdateShortUrlType, UrlCursor, UserUrlStats } from "./url.types.js";

export interface IUrlRepository {
  createShortUrl(data: CreateShortUrlType): Promise<ShortURL>;
  findShortUrlByShortCode(shortCode: string): Promise<ShortURL | null>;
  findShortUrlByIdAndUserId(id: string, userId: string): Promise<ShortURL | null>;
  findShortUrlsByUserId(
    userId: string,
    limit: number,
    cursor?: UrlCursor,
    search?: string
  ): Promise<ShortURL[]>;
  updateShortUrl(
    shortCode: string,
    data: UpdateShortUrlType
  ): Promise<ShortURL | null>;
  deleteShortUrl(shortCode: string): Promise<ShortURL>;
  findTopHotUrls(limit: number): Promise<ShortURL[]>;
  getUserUrlStats(userId: string): Promise<UserUrlStats>;
}
