import { ShortURL } from "@prisma/client";
import { CreateShortUrlType, UpdateShortUrlType, UrlCursor } from "./url.types.js";

export interface IUrlRepository {
  createShortUrl(data: CreateShortUrlType): Promise<ShortURL>;
  findShortUrlByShortCode(shortCode: string): Promise<ShortURL | null>;
  findShortUrlByIdAndUserId(id: string, userId: string): Promise<ShortURL | null>;
  findShortUrlsByUserId(
    userId: string,
    limit: number,
    cursor?: UrlCursor
  ): Promise<ShortURL[]>;
  updateShortUrl(
    shortCode: string,
    data: UpdateShortUrlType
  ): Promise<ShortURL | null>;
}
