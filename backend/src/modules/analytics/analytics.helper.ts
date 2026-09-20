import { AppError } from "../../utils/Errors/AppError.js";
import { ClickAnalyticsCursor } from "./analytics.types.js";

// 1. Cursor Pagination: Base64 Serializer
export const encodeAnalyticsCursor = (cursor: ClickAnalyticsCursor): string => {
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

// 2. Cursor Pagination: Base64 Deserializer with Crash-Proof Validation
export const decodeAnalyticsCursor = (cursor: string): ClickAnalyticsCursor => {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));

    // Guard against malformed objects missing required keys
    if (!decoded.clickedAt || !decoded.id) {
      throw new Error("Missing cursor fields");
    }

    const clickedAt = new Date(decoded.clickedAt);

    // Guard against invalid date values
    if (isNaN(clickedAt.getTime())) {
      throw new Error("Invalid date in cursor");
    }

    return {
      clickedAt,
      id: decoded.id,
    };
  } catch {
    throw new AppError("Invalid analytics pagination cursor", 400);
  }
};

