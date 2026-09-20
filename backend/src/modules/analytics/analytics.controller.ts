import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/common/CatchAsync.js";
import { AppError } from "../../utils/Errors/AppError.js";
import { sendResponse } from "../../utils/response/sendResponse.js";
import { AnalyticsService } from "./analytics.service.js";

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Fetch Analytics for a Short Link (GET /api/v1/urls/:id/analytics)
  getLinkAnalytics = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError("Authentication required", 401);
      }

      const { id } = req.params;
      if (!id || typeof id !== "string") {
        throw new AppError("Valid URL identifier parameter is required", 400);
      }

      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

      const result = await this.analyticsService.getLinkAnalytics(
        userId,
        id,
        limit,
        cursor
      );

      return sendResponse(res, 200, {
        success: true,
        message: "Link analytics retrieved successfully",
        data: result,
      });
    }
  );
}
