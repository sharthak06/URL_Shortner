import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import authRouter from "./modules/auth/auth.route.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { AppError } from "./utils/Errors/AppError.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 1. Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is healthy" });
});

// 2. Feature Routes
app.use("/api/v1/auth", authRouter);

// 3. Unhandled route handler (404)
app.use((req, _res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// 4. Global Error Handler (MUST BE AT THE VERY BOTTOM!)
app.use(globalErrorHandler);
