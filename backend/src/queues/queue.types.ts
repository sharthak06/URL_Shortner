export type ClickJobPayload = {
  shortUrlId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  country?: string | null;
  clickedAt: string; // ISO 8601 string representation for JSON serialization
};

export type DeadLetterJobPayload = {
  originalJob: ClickJobPayload;
  failedReason: string;
  attemptsMade: number;
  failedAt: string;
  stacktrace?: string[] | null;
};
