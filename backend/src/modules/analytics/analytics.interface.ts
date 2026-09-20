import { ClickAnalytics } from "@prisma/client";
import {
  RecordClickInput,
  ClickAnalyticsCursor,
  CountryStat,
  ReferrerStat,
} from "./analytics.types.js";

export interface IAnalyticsRepository {
  recordClick(data: RecordClickInput): Promise<ClickAnalytics | null>;
  findClicksByShortUrlId(
    shortUrlId: string,
    limit: number,
    cursor?: ClickAnalyticsCursor
  ): Promise<ClickAnalytics[]>;
  getTotalClicksByShortUrlId(shortUrlId: string): Promise<number>;
  getTopCountriesByShortUrlId(
    shortUrlId: string,
    limit?: number
  ): Promise<CountryStat[]>;
  getTopReferrersByShortUrlId(
    shortUrlId: string,
    limit?: number
  ): Promise<ReferrerStat[]>;
}
