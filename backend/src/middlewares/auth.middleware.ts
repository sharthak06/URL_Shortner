import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/Errors/AppError.js";
import {
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  setAccessTokenCookie,
} from "../modules/auth/auth.helper.js";
import { JwtPayloadType } from "../modules/auth/auth.types.js";
import { logger } from "../config/logger.js";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let accessToken: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      accessToken = req.cookies.accessToken;
    }

    if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken) as JwtPayloadType;
        req.user = {
          userId: payload.userId,
        };
        return next();
      } catch (err) {
        // If expired or invalid, fallback to refreshToken if present
        if (!req.cookies?.refreshToken) {
          throw err;
        }
      }
    }

    if (req.cookies?.refreshToken) {
      const refreshPayload = verifyRefreshToken(req.cookies.refreshToken) as JwtPayloadType;
      req.user = {
        userId: refreshPayload.userId,
      };

      // Best-effort: mint a fresh access token so the client isn't silently
      // riding the refresh token for its full lifetime. Never blocks the
      // request — the user is already authenticated off a valid refresh token.
      try {
        const newAccessToken = signAccessToken({ userId: refreshPayload.userId });
        setAccessTokenCookie(res, newAccessToken);
      } catch (cookieError) {
        logger.warn({
          event: "ACCESS_TOKEN_REFRESH_COOKIE_FAILED",
          userId: refreshPayload.userId,
          error: cookieError instanceof Error ? cookieError.message : "Unknown error",
        });
      }

      return next();
    }

    return next(new AppError("Authentication required", 401));
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
