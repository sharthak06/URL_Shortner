import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import healthRouter from "./modules/health/health.route.js";
import authRouter from "./modules/auth/auth.route.js";
import urlRouter from "./modules/url/url.route.js";
import analyticsRouter from "./modules/analytics/analytics.route.js";
import { urlController } from "./modules/url/url.container.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { AppError } from "./utils/Errors/AppError.js";
import { globalRateLimiter } from "./middlewares/rate-limit/global-rate-limit.middleware.js";

export const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Tier 1: Global Fixed-Window Rate Limiting
app.use(globalRateLimiter);


app.use("/health", healthRouter);
app.use("/api/v1/health", healthRouter);


app.get("/r/:shortCode", urlController.redirectToOriginalURL);


app.use("/api/v1/auth", authRouter);
app.use("/api/v1/urls", urlRouter);
app.use("/api/v1/analytics", analyticsRouter);


app.use((req, _res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});


app.use(globalErrorHandler);
