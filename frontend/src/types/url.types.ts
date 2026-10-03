export interface ShortURL {
  id: string;
  userId: string;
  originalUrl: string;
  shortCode: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUrlPayload {
  originalUrl: string;
}

export interface UpdateUrlPayload {
  originalUrl: string;
}

export interface UserUrlsData {
  items: ShortURL[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UserUrlsResponse {
  statusCode: number;
  message: string;
  data: UserUrlsData;
}

export interface SingleUrlResponse {
  statusCode: number;
  message: string;
  data: {
    url: ShortURL;
  };
}

export interface ClickDeviceBreakdown {
  device: string;
  count: number;
}

export interface ClickCountryBreakdown {
  country: string;
  count: number;
}

export interface ClickItem {
  id: string;
  shortUrlId: string;
  ipAddress: string | null;
  userAgent: string | null;
  referrer: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  clickedAt: string;
}

export interface AnalyticsData {
  shortUrlId: string;
  totalClicks: number;
  topCountries: Array<{ country: string; clicks: number }>;
  topReferrers: Array<{ referrer: string; clicks: number }>;
  clicks: {
    items: ClickItem[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface AnalyticsResponse {
  statusCode: number;
  message: string;
  data: AnalyticsData;
}

export interface UrlStats {
  totalLinks: number;
  totalClicks: number;
  // Most-clicked link, or null until at least one link has a click
  topLink: Pick<ShortURL, "id" | "shortCode" | "originalUrl" | "clickCount"> | null;
}

export interface UrlStatsResponse {
  statusCode: number;
  message: string;
  data: UrlStats;
}
