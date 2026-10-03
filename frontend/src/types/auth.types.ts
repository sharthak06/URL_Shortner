export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  data: {
    user: User;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  token: string;
}

// The magic link now ONLY verifies the email - no session is created. `alreadyVerified`
// distinguishes a harmless replay of an already-used link from a fresh verification.
export interface VerifyEmailResult {
  alreadyVerified: boolean;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}
