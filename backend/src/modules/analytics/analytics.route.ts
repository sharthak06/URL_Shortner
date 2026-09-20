import { Router } from "express";
import { analyticsController } from "./analytics.container.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  getLinkAnalyticsParamsSchema,
  getLinkAnalyticsQuerySchema,
} from "./analytics.schema.js";

const analyticsRouter = Router();

// 1. Protected Analytics Query Endpoint (GET /api/v1/analytics/:id)
analyticsRouter.get(
  "/:id",
  authMiddleware,
  validate(getLinkAnalyticsParamsSchema, "params"),
  validate(getLinkAnalyticsQuerySchema, "query"),
  analyticsController.getLinkAnalytics
);

export default analyticsRouter;
