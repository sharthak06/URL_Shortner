import { customAlphabet } from "nanoid";
import { AppError } from "../../utils/Errors/AppError.js";
import { UrlCursor } from "./url.types.js";
import { env } from "../../config/env.config.js";

// 1. Base62 Alphabet (26 uppercase + 26 lowercase + 10 digits = 62 characters)
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const nanoid = customAlphabet(ALPHABET, env.URL_SHORTCODE_LENGTH);

export const createShortCode = (): string => {
  return nanoid();
};

// 2. Canonicalization & Protocol Validation
const ALLOWED_PROTOCOLS = ["http:", "https:"];

export const parseUrl = (originalUrl: string): string => {
  try {
    const parsed = new URL(originalUrl);

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      throw new AppError("Only http and https protocols are allowed", 400);
    }

    // Returns canonicalized URL (lowercased protocol + domain)
    return parsed.toString();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Invalid URL format", 400);
  }
};

// 3. Cache Key Helper (Used when we integrate Redis in Phase 2)
export const getShortUrlCacheKey = (shortCode: string): string => {
  return `shortCode:${shortCode}`;
};

// 4. Cursor Pagination: Base64 Serializer
export const encodeCursor = (cursor: UrlCursor): string => {
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

// 5. Cursor Pagination: Base64 Deserializer with Crash-Proof Error Handling
export const decodeCursor = (cursor: string): UrlCursor => {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));

    // Guard against malformed objects missing required keys
    if (!decoded.createdAt || !decoded.id) {
      throw new Error("Missing cursor fields");
    }

    const createdAt = new Date(decoded.createdAt);

    // Guard against invalid date formats (e.g. "createdAt": "invalid-date")
    if (isNaN(createdAt.getTime())) {
      throw new Error("Invalid date in cursor");
    }

    return {
      createdAt,
      id: decoded.id,
    };
  } catch {
    throw new AppError("Invalid pagination cursor", 400);
  }
};
