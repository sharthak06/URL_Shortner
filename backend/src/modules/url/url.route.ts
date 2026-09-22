import { Router } from "express";
import { urlController } from "./url.container.js";
import { analyticsController } from "../analytics/analytics.container.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createUrlSchema,
  updateUrlSchema,
  getUserUrlsQuerySchema,
} from "./url.schema.js";
import {
  getLinkAnalyticsParamsSchema,
  getLinkAnalyticsQuerySchema,
} from "../analytics/analytics.schema.js";
import { shortUrlTokenBucketRateLimit } from "../../middlewares/rate-limit/short-url-token-bucket-rate-limit.js";

const urlRouter = Router();

// 1. Create Short URL Endpoint (POST /api/v1/urls/ & POST /api/v1/urls/create-short-url)
urlRouter.post(
  "/",
  authMiddleware,
  shortUrlTokenBucketRateLimit,
  validate(createUrlSchema),
  urlController.createShortUrl
);

urlRouter.post(
  "/create-short-url",
  authMiddleware,
  shortUrlTokenBucketRateLimit,
  validate(createUrlSchema),
  urlController.createShortUrl
);

urlRouter.get(
  "/",
  authMiddleware,
  validate(getUserUrlsQuerySchema, "query"),
  urlController.getUserUrls
);

// 3. Protected Analytics Query (GET /api/v1/urls/:id/analytics)
urlRouter.get(
  "/:id/analytics",
  authMiddleware,
  validate(getLinkAnalyticsParamsSchema, "params"),
  validate(getLinkAnalyticsQuerySchema, "query"),
  analyticsController.getLinkAnalytics
);

urlRouter.patch(
  "/:shortCode",
  authMiddleware,
  validate(updateUrlSchema),
  urlController.updateOriginalUrl
);

// 5. Delete Short URL Endpoint (DELETE /api/v1/urls/:shortCode)
urlRouter.delete(
  "/:shortCode",
  authMiddleware,
  urlController.deleteShortUrl
);

// 6. Public Redirection Endpoint (GET /api/v1/urls/r/:shortCode)
urlRouter.get("/r/:shortCode", urlController.redirectToOriginalURL);

export default urlRouter;


