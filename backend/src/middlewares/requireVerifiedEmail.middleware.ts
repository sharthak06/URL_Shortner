import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/Errors/AppError.js";
import { catchAsync } from "../utils/common/CatchAsync.js";
import { authRepository } from "../modules/auth/auth.container.js";

/**
 * Gates short-URL creation behind a verified email, without blocking login or
 * dashboard access for unverified users. Must run after authMiddleware.
 */
export const requireVerifiedEmail = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new AppError("User not Found", 404);
    }

    if (!user.emailVerified) {
      throw new AppError(
        "Please verify your email address before creating short links",
        403,
        "EMAIL_NOT_VERIFIED"
      );
    }

    next();
  }
);
