import { ClickAnalytics } from "@prisma/client";

export type RecordClickInput = {
  shortUrlId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  country?: string | null;
  clickedAt?: Date;
};

export type ClickAnalyticsCursor = {
  clickedAt: Date;
  id: string;
};

export type PaginatedAnalyticsResponse<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CountryStat = {
  country: string;
  clicks: number;
};

export type ReferrerStat = {
  referrer: string;
  clicks: number;
};

export type AnalyticsSummaryResponse = {
  shortUrlId: string;
  totalClicks: number;
  topCountries: CountryStat[];
  topReferrers: ReferrerStat[];
  clicks: PaginatedAnalyticsResponse<ClickAnalytics>;
};
