import { Resend } from "resend";
import { env } from "../config/env.config.js";
import { logger } from "../config/logger.js";

const resend = new Resend(env.RESEND_API_KEY);

const EMAIL_FROM = "URL Shortener <onboarding@resend.dev>";

export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  const verifyLink = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  // The Resend SDK does not throw on API-level failures - it resolves with
  // { data, error } - so a failed send must be surfaced explicitly.
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Confirm your email address",
    text: `Click the link below to confirm your email address, then sign in with your password. This link expires in ${env.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN}.\n\n${verifyLink}\n\nIf you didn't create an account, you can ignore this email.`,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }

  logger.info({ event: "VERIFICATION_EMAIL_SENT", to });
};

export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Reset your password",
    text: `Reset your password by visiting the link below. This link expires in ${env.PASSWORD_RESET_TOKEN_EXPIRES_IN}.\n\n${resetLink}\n\nIf you didn't request a password reset, you can ignore this email.`,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  logger.info({ event: "PASSWORD_RESET_EMAIL_SENT", to });
};
