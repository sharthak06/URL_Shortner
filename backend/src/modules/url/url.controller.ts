import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/common/CatchAsync.js";
import { AppError } from "../../utils/Errors/AppError.js";
import { sendResponse } from "../../utils/response/sendResponse.js";
import { UrlService } from "./url.service.js";

export class URLController {
  constructor(private readonly urlService: UrlService) {}

  // 1. Create a new Short URL (POST /api/v1/urls)
  createShortUrl = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError("Authentication required", 401);
      }

      const { originalUrl } = req.body;
      const shortUrl = await this.urlService.createShortUrl(
        { originalUrl },
        userId
      );

      return sendResponse(res, 201, {
        success: true,
        message: "Short URL created successfully",
        data: shortUrl,
      });
    }
  );

  // 2. Fetch Paginated Links for Authenticated User (GET /api/v1/urls)
  getUserUrls = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError("Authentication required", 401);
      }

      // Defensively parse query params to handle strings/numbers safely
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

      const result = await this.urlService.getUserUrls(userId, limit, cursor);

      return sendResponse(res, 200, {
        success: true,
        message: "User URLs fetched successfully",
        data: result,
      });
    }
  );

  // 3. Update Destination for an Existing Short Link (PATCH /api/v1/urls/:shortCode)
  updateOriginalUrl = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError("Authentication required", 401);
      }

      const { shortCode } = req.params;
      if (!shortCode || typeof shortCode !== "string") {
        throw new AppError("Valid short code parameter is required", 400);
      }

      const { updatedOriginalUrl, originalUrl } = req.body;
      const targetUrl = updatedOriginalUrl || originalUrl;

      const updatedShortUrl = await this.urlService.updateOriginalUrl(
        userId,
        shortCode,
        { updatedOriginalUrl: targetUrl }
      );

      return sendResponse(res, 200, {
        success: true,
        message: "Original URL updated successfully",
        data: updatedShortUrl,
      });
    }
  );

  // 4. Public 302 Redirection (GET /:shortCode or /r/:shortCode)
  redirectToOriginalURL = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { shortCode } = req.params;
      if (!shortCode || typeof shortCode !== "string") {
        throw new AppError("Valid short code parameter is required", 400);
      }

      const { originalUrl } =
        await this.urlService.getOriginalUrlFromShortCode(shortCode);

      // Use 302 Found (Temporary Redirect) so browsers don't cache the destination,
      // ensuring every click hits the server for accurate analytics
      return res.redirect(302, originalUrl);
    }
  );
}
