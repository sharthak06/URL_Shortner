import { apiClient } from "./client";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
  VerifyEmailPayload,
  VerifyEmailResult,
  ResendVerificationPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "../types/auth.types";

interface VerifyEmailResponse {
  statusCode: number;
  message: string;
  data: VerifyEmailResult;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<User> => {
    const res = await apiClient.post<AuthResponse>("/auth/login", payload);
    return res.data.data.user;
  },

  // No session is created here - the account isn't usable until the magic link
  // (verifyEmail) is clicked, so this only returns the newly created, unverified user.
  register: async (payload: RegisterPayload): Promise<User> => {
    const res = await apiClient.post<AuthResponse>("/auth/register", payload);
    return res.data.data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<AuthResponse>("/auth/me");
    return res.data.data.user;
  },

  // The magic link only verifies the email - no session is created. `alreadyVerified`
  // is true for a harmless replay of an already-used link.
  verifyEmail: async (payload: VerifyEmailPayload): Promise<VerifyEmailResult> => {
    const res = await apiClient.post<VerifyEmailResponse>("/auth/verify-email", payload);
    return res.data.data;
  },

  // Public/email-based - no session required, since an unverified account can't log in
  // to reach an authenticated endpoint.
  resendVerification: async (payload: ResendVerificationPayload): Promise<void> => {
    await apiClient.post("/auth/resend-verification", payload);
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<void> => {
    await apiClient.post("/auth/forgot-password", payload);
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<void> => {
    await apiClient.post("/auth/reset-password", payload);
  },
};
