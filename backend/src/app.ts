import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { env } from "./config/env.config.js";
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

// CSP is disabled because Express also serves the built SPA (inline styles
// from Framer Motion, data: URLs for client-generated QR codes, etc.).
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Tier 1: Global Fixed-Window Rate Limiting
app.use(globalRateLimiter);

app.use("/health", healthRouter);
app.use("/api/v1/health", healthRouter);

// Public 302 Redirection Route
app.get("/r/:shortCode", urlController.redirectToOriginalURL);

// Authentication & Session Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/auth", authRouter);

// URL Shortening & Link Lifecycle Management Routes
app.use("/api/v1/urls", urlRouter);
app.use("/api/v1/links", urlRouter);
app.use("/api/links", urlRouter);

// Real-Time Analytics Query Routes
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/analytics", analyticsRouter);

// In production, serve the built React SPA from the same origin so the
// frontend and API share one domain (keeps sameSite="lax" auth cookies working).
// The frontend build is copied to dist/public during the Render build step.
if (env.NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "public");
  app.use(express.static(clientDistPath));

  // SPA fallback: serve index.html for any non-API/non-redirect GET route so
  // client-side routing (React Router) works on refresh / deep links.
  app.get(/^(?!\/(api|r|health)(\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use((req, _res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);
