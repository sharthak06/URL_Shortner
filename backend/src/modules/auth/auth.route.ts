import { Router } from "express";
import { authController } from "./auth.container.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { registerUserSchema, loginUserSchema } from "./auth.schema.js";
import { loginSlidingWindowRateLimit } from "../../middlewares/rate-limit/login-sliding-window-rate-limit.js";

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

export default authRouter;
