import { ShortURL } from "@prisma/client";

export type CreateShortUrlType = {
  originalUrl: string;
  userId: string;
  shortCode: string;
};

export type UpdateShortUrlType = {
  originalUrl: string;
};

export type UrlCursor = {
  createdAt: Date;
  id: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type UserUrlStats = {
  totalLinks: number;
  totalClicks: number;
  // The user's most-clicked link, or null until at least one link has a click
  topLink: Pick<ShortURL, "id" | "shortCode" | "originalUrl" | "clickCount"> | null;
};
