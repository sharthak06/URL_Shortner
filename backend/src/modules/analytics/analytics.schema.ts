import { z } from "zod";

// 1. Path Params Schema (GET /api/v1/urls/:id/analytics)
export const getLinkAnalyticsParamsSchema = z
  .object({
    id: z
      .string({ error: "URL identifier is required" })
      .trim()
      .min(1, "URL identifier cannot be empty"),
  })
  .strict();

// 2. Query Params Schema (GET /api/v1/urls/:id/analytics?limit=10&cursor=...)
export const getLinkAnalyticsQuerySchema = z
  .object({
    limit: z.coerce
      .number({ error: "Limit must be a valid number" })
      .int("Limit must be an integer")
      .min(1, "Limit must be at least 1")
      .max(100, "Limit cannot exceed 100")
      .default(10),
    cursor: z
      .string({ error: "Cursor must be a string" })
      .trim()
      .optional(),
  })
  .strict();

export type GetLinkAnalyticsParamsType = z.infer<
  typeof getLinkAnalyticsParamsSchema
>;
export type GetLinkAnalyticsQueryType = z.infer<
  typeof getLinkAnalyticsQuerySchema
>;
