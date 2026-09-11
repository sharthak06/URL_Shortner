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
