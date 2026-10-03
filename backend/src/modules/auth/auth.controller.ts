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
      // No session is created here - the account isn't usable until the magic link
      // (the verification email) is clicked to confirm the email; signing in is a
      // separate step afterward.
      res.status(201).json({
        success: true,
        message: "Check your email to confirm your account, then sign in",
        data: {
          user: result.user,
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
      // 1. Set the Refresh & Access Tokens in cookies
      setAuthCookies(res, result.refreshToken, result.accessToken);
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
      // Wrap in { user } to match the login/register response shape the
      // frontend reads (res.data.data.user); returning the user object
      // directly made getMe resolve to undefined and log the user out on refresh.
      res.status(200).json({
        success: true,
        message: "User profile fetched successfully",
        data: { user },
      });
    }
  );

  // The magic link now ONLY verifies the email - no session is created here.
  verifyEmail = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { token } = req.body;
      const result = await this.authService.verifyEmailService(token);

      if (result.alreadyVerified) {
        return res.status(200).json({
          success: true,
          message: "Your email is already verified. Please sign in.",
          data: { alreadyVerified: true },
        });
      }

      res.status(200).json({
        success: true,
        message: "Email confirmed. Please sign in.",
        data: { alreadyVerified: false },
      });
    }
  );

  resendVerification = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email } = req.body;
      await this.authService.resendVerificationService({ email });
      // Identical response regardless of whether the email exists or is already
      // verified - prevents account enumeration, same as forgotPassword.
      res.status(200).json({
        success: true,
        message: "If an account needs verification, we've sent a new link.",
      });
    }
  );

  forgotPassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email } = req.body;
      await this.authService.forgotPasswordService({ email });
      // Identical response whether or not the account exists - prevents account enumeration.
      res.status(200).json({
        success: true,
        message: "If an account exists for that email, we've sent a reset link.",
      });
    }
  );

  resetPassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { token, newPassword } = req.body;
      await this.authService.resetPasswordService({ token, newPassword });
      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    }
  );
}
