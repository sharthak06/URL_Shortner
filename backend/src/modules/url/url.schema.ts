import { z } from "zod";

// Helper function to ensure URL uses strictly http or https protocols
const isHttpOrHttps = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// 1. Creation Schema (POST /api/v1/urls/create-short-url)
export const createUrlSchema = z
  .object({
    originalUrl: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "Original URL is required"
            : "Original URL must be a string",
      })
      .trim()
      .min(1, "URL cannot be empty")
      .max(2048, "URL is too long (maximum 2048 characters allowed)")
      .url("Invalid URL format")
      .refine(isHttpOrHttps, {
        message: "Only http:// and https:// protocols are permitted",
      }),
  })
  .strict();

// 2. Update Schema (PATCH /api/v1/urls/:shortCode)
export const updateUrlSchema = z
  .object({
    updatedOriginalUrl: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "Updated URL is required"
            : "Updated URL must be a string",
      })
      .trim()
      .min(1, "URL cannot be empty")
      .max(2048, "URL is too long (maximum 2048 characters allowed)")
      .url("Invalid URL format")
      .refine(isHttpOrHttps, {
        message: "Only http:// and https:// protocols are permitted",
      }),
  })
  .strict();

 
// 3. Cursor Pagination Query Schema (GET /api/v1/urls?limit=10&cursor=...)
export const getUserUrlsQuerySchema = z
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

// 4. Inferred TypeScript Types
export type UrlInputType = z.infer<typeof createUrlSchema>;
export type UpdateUrlInputType = z.infer<typeof updateUrlSchema>;
export type GetUserUrlsQueryType = z.infer<typeof getUserUrlsQuerySchema>;
