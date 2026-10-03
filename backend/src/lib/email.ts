import { env } from "../config/env.config.js";
import { logger } from "../config/logger.js";

const BREVO_SEND_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const sender = {
  name: env.BREVO_SENDER_NAME,
  email: env.BREVO_SENDER_EMAIL,
};

// Send a transactional email through Brevo's REST API. Brevo only requires a
// single verified sender address (no domain), so it can deliver to any
// recipient on the free tier. Uses the global fetch available on Node 18+.
const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
  const res = await fetch(BREVO_SEND_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo send failed (${res.status}): ${body}`);
  }
};

export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  const verifyLink = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmail(
    to,
    "Confirm your email address",
    `Click the link below to confirm your email address, then sign in with your password. This link expires in ${env.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN}.\n\n${verifyLink}\n\nIf you didn't create an account, you can ignore this email.`,
  );

  logger.info({ event: "VERIFICATION_EMAIL_SENT", to });
};

export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail(
    to,
    "Reset your password",
    `Reset your password by visiting the link below. This link expires in ${env.PASSWORD_RESET_TOKEN_EXPIRES_IN}.\n\n${resetLink}\n\nIf you didn't request a password reset, you can ignore this email.`,
  );

  logger.info({ event: "PASSWORD_RESET_EMAIL_SENT", to });
};
