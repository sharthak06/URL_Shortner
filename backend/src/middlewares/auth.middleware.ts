import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/Errors/AppError.js";
import { verifyAccessToken } from "../modules/auth/auth.helper.js";
import { JwtPayloadType } from "../modules/auth/auth.types.js";

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check if Authorization header exists
    if (!authHeader) {
      return next(new AppError("Authentication required", 401));
    }

    // 2. Must follow "Bearer <token>" convention
    if (!authHeader.startsWith("Bearer ")) {
      return next(new AppError("Invalid format for authentication header", 401));
    }

    const accessToken = authHeader.split(" ")[1];

    if (!accessToken) {
      return next(new AppError("Access token missing", 401));
    }

    // 3. Verify signature and extract payload
    const payload = verifyAccessToken(accessToken) as JwtPayloadType;

    // 4. Attach user to request for downstream controllers
    req.user = {
      userId: payload.userId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError("Token expired", 401));
    }

    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof SyntaxError
    ) {
      return next(new AppError("Invalid token", 401));
    }

    return next(new AppError("Authentication failed", 401));
  }
};
