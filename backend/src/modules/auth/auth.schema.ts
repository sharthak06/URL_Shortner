import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().trim().optional().default("Architect"),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters long").trim()
}).strict();

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters long").trim()
}).strict();

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required").trim(),
}).strict();

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
}).strict();

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required").trim(),
  newPassword: z.string().min(6, "Password must be at least 6 characters long").trim(),
}).strict();

export type RegisterUserInputType = z.infer<typeof registerUserSchema>;
export type LoginUserInputType = z.infer<typeof loginUserSchema>;
export type VerifyEmailInputType = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInputType = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInputType = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInputType = z.infer<typeof resetPasswordSchema>;
