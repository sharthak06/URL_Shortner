import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/common/CatchAsync.js";
import { prisma } from "../../lib/prisma.js";

export class HealthController {
  check = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    res.status(200).json({
      status: "ok",
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  checkDatabase = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(503).json({
        status: "error",
        database: "disconnected",
        error: error?.message || "Database connection failed",
      });
    }
  });
}

export const healthController = new HealthController();
