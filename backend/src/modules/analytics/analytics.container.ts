import { AnalyticsRepository } from "./analytics.repository.js";
import { AnalyticsService } from "./analytics.service.js";
import { AnalyticsController } from "./analytics.controller.js";
import { urlRepository } from "../url/url.container.js";

const analyticsRepository = new AnalyticsRepository();
const analyticsService = new AnalyticsService(
  analyticsRepository,
  urlRepository
);
const analyticsController = new AnalyticsController(analyticsService);

export { analyticsRepository, analyticsService, analyticsController };
