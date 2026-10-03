import { Router } from "express";
import { authController } from "./auth.container.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  registerUserSchema,
  loginUserSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema.js";
import { loginSlidingWindowRateLimit } from "../../middlewares/rate-limit/login-sliding-window-rate-limit.js";
import {
  forgotPasswordRateLimit,
  resendVerificationRateLimit,
} from "../../middlewares/rate-limit/email-abuse-sliding-window-rate-limit.js";

const authRouter = Router();

// Authentication Endpoints
authRouter.post(
  "/register",
  validate(registerUserSchema),
  authController.register
);

authRouter.post(
  "/login",
  loginSlidingWindowRateLimit,
  validate(loginUserSchema),
  authController.login
);
authRouter.post("/refresh", authController.refreshToken);
authRouter.post("/logout", authController.logout);

// Protected Profile Endpoint
authRouter.get("/me", authMiddleware, authController.getMe);

// Email Verification
authRouter.post(
  "/verify-email",
  validate(verifyEmailSchema),
  authController.verifyEmail
);

authRouter.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  resendVerificationRateLimit,
  authController.resendVerification
);

// Password Reset
authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPasswordRateLimit,
  authController.forgotPassword
);

authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default authRouter;
