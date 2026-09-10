import { NextFunction, Request, Response } from "express";
import { env } from "../config/env.config.js";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";
  const message = err.message || "Something went wrong";

  // In development, show full stack trace for easy debugging
  if (env.NODE_ENV === "development") {
    console.error("[Error]:", err);
    return res.status(statusCode).json({
      status,
      message,
      stack: err.stack,
      error: err,
    });
  }

  // In production: if it's an operational error (AppError), send the clean message
  if (err.isOperational) {
    return res.status(statusCode).json({
      status,
      message,
    });
  }

  // In production: for unknown programmer bugs (e.g. null pointer), hide details
  console.error("[Fatal Error]:", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong on our end",
  });
};
