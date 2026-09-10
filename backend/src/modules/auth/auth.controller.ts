import { AuthService } from "./auth.service.js";
import { setAuthCookies, clearAuthCookies } from "./auth.helper.js";
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/common/CatchAsync.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name, email, password } = req.body;
      const result = await this.authService.registerUserService({
        name,
        email,
        password,
      });
      // 1. Set the Refresh Token in a secure HTTP-Only cookie
      setAuthCookies(res, result.refreshToken);
      // 2. Send the Access Token and sanitized user back in JSON
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    }
  );

  login = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, password } = req.body;
      const result = await this.authService.loginUserService({
        email,
        password,
      });
      // 1. Set the Refresh Token in cookie
      setAuthCookies(res, result.refreshToken);
      // 2. Send the Access Token and user in JSON
      res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    }
  );

  refreshToken = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const token = req.cookies?.refreshToken;
      const result = await this.authService.refreshAccessTokenService(token);

      res.status(200).json({
        success: true,
        message: "Access token refreshed successfully",
        data: result,
      });
    }
  );

  logout = catchAsync(
    async (_req: Request, res: Response, next: NextFunction) => {
      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: "User logged out successfully",
      });
    }
  );

  getMe = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      // req.user will be attached by our auth middleware
      const userId = (req as any).user?.userId as string;
      const user = await this.authService.getLoggedInUser(userId);
      res.status(200).json({
        success: true,
        message: "User profile fetched successfully",
        data: user,
      });
    }
  );
}

