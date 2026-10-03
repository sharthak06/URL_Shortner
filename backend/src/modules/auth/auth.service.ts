import ms from "ms";
import { Prisma } from "@prisma/client";
import { AppError } from "../../utils/Errors/AppError.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.config.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../lib/email.js";
import {
  comparePassword,
  compareAgainstDummyHash,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateRawToken,
  hashToken,
} from "./auth.helper.js";
import { IAuthRepository } from "./auth.interface.js";
import { toUserResponse } from "./auth.response.js";
import {
  LoginUserInputType,
  RegisterUserInputType,
  ResendVerificationInputType,
  ForgotPasswordInputType,
  ResetPasswordInputType,
} from "./auth.schema.js";
import { JwtPayloadType } from "./auth.types.js";

export class AuthService {
  constructor(private readonly authRepo: IAuthRepository) {}

  private createHashedToken(expiresInEnvVar: string) {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + ms(expiresInEnvVar as ms.StringValue));
    return { rawToken, tokenHash, expiresAt };
  }

  async registerUserService(data: RegisterUserInputType) {
    const existingUser = await this.authRepo.findUserByEmail(data.email);
    if (existingUser) {
      throw new AppError("User Already Exists", 409);
    }

    const hashedPassword = await hashPassword(data.password);
    let user;
    try {
      user = await this.authRepo.createUser({
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
      });
    } catch (error) {
      // A concurrent registration with the same email can pass the existence check
      // above before either insert lands; the loser hits the unique constraint on email.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError("User Already Exists", 409);
      }
      throw error;
    }

    // Issue a magic-link (email verification) token immediately. A failure to send
    // this email is logged but never fails registration - the user can request a new
    // one via /auth/resend-verification. No session is created here: the account is
    // not usable until the magic link is clicked (see verifyEmailService).
    await this.issueVerificationToken(user.id, user.email).catch((err) => {
      logger.error({
        event: "VERIFICATION_EMAIL_SEND_FAILED",
        userId: user.id,
        error: err instanceof Error ? err.message : err,
      });
    });

    return {
      user: toUserResponse(user),
    };
  }

  async loginUserService(data: LoginUserInputType) {
    const user = await this.authRepo.findUserByEmail(data.email);
    if (!user || !user.passwordHash) {
      await compareAgainstDummyHash(data.password);
      throw new AppError("Invalid credentials", 401);
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    // Checked only after credentials are confirmed valid, so a wrong password and an
    // unverified account never look different to someone probing an email address.
    if (!user.emailVerified) {
      throw new AppError(
        "Please verify your email before signing in",
        403,
        "EMAIL_NOT_VERIFIED"
      );
    }

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    return {
      accessToken,
      refreshToken,
      user: toUserResponse(user),
    };
  }

  async getLoggedInUser(userId: string) {
    const user = await this.authRepo.findUserById(userId);
    if (!user) {
      throw new AppError("User not Found", 404);
    }
    return toUserResponse(user);
  }

  async refreshAccessTokenService(refreshToken?: string) {
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401);
    }

    let decoded: JwtPayloadType;
    try {
      decoded = verifyRefreshToken(refreshToken) as JwtPayloadType;
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = await this.authRepo.findUserById(decoded.userId);
    if (!user) {
      throw new AppError("User not Found", 404);
    }

    const accessToken = signAccessToken({ userId: user.id });

    return {
      accessToken,
    };
  }

  // Shared by registration and /auth/resend-verification: invalidates any previous
  // unexpired verification token for the user, then issues and emails a fresh one.
  private async issueVerificationToken(userId: string, email: string) {
    const { rawToken, tokenHash, expiresAt } = this.createHashedToken(env.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN);

    await this.authRepo.issueEmailVerificationToken({ userId, tokenHash, expiresAt });

    await sendVerificationEmail(email, rawToken);
  }

  // The magic link now ONLY verifies the email - it no longer signs the user in.
  // Logging in stays a separate step with the password set at signup.
  async verifyEmailService(token: string) {
    const tokenHash = hashToken(token);
    const verificationToken = await this.authRepo.findEmailVerificationTokenByHash(tokenHash);

    if (!verificationToken) {
      throw new AppError("Invalid or expired verification link", 400);
    }

    if (verificationToken.consumedAt) {
      // Already used. Most commonly this is a mail client's safe-link prescanner
      // opening the link before the real user clicks it, not a genuine replay - if
      // the account ended up verified, treat it as a harmless no-op rather than a
      // scary error.
      const user = await this.authRepo.findUserById(verificationToken.userId);
      if (user?.emailVerified) {
        return { alreadyVerified: true as const };
      }
      throw new AppError("Invalid or expired verification link", 400);
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new AppError("Invalid or expired verification link", 400);
    }

    await this.authRepo.markEmailVerified(verificationToken.userId);
    // Single-use: consumedAt is set immediately so the same link can't verify twice,
    // but the row is kept (not deleted) so a later replay can still be recognized as
    // "already verified" above instead of "invalid".
    await this.authRepo.consumeEmailVerificationToken(verificationToken.id);

    return { alreadyVerified: false as const };
  }

  // Public, email-based (no session required, since an unverified user can no longer
  // log in to reach an authenticated endpoint). Always resolves successfully regardless
  // of whether the email is registered or already verified, to avoid leaking account
  // state - mirrors forgotPasswordService's account-enumeration protection.
  async resendVerificationService(data: ResendVerificationInputType) {
    const user = await this.authRepo.findUserByEmail(data.email);
    if (!user || user.emailVerified) {
      return;
    }

    await this.issueVerificationToken(user.id, user.email).catch((err) => {
      logger.error({
        event: "VERIFICATION_EMAIL_SEND_FAILED",
        userId: user.id,
        error: err instanceof Error ? err.message : err,
      });
    });
  }

  // Always resolves successfully regardless of whether the email is registered,
  // to avoid leaking account existence (account-enumeration protection). Only
  // actually sends an email when the account exists.
  async forgotPasswordService(data: ForgotPasswordInputType) {
    const user = await this.authRepo.findUserByEmail(data.email);
    if (!user) {
      return;
    }

    await this.authRepo.deletePasswordResetTokensForUser(user.id);

    const { rawToken, tokenHash, expiresAt } = this.createHashedToken(env.PASSWORD_RESET_TOKEN_EXPIRES_IN);

    await this.authRepo.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await sendPasswordResetEmail(user.email, rawToken).catch((err) => {
      logger.error({
        event: "PASSWORD_RESET_EMAIL_SEND_FAILED",
        userId: user.id,
        error: err instanceof Error ? err.message : err,
      });
    });
  }

  async resetPasswordService(data: ResetPasswordInputType) {
    const tokenHash = hashToken(data.token);
    const resetToken = await this.authRepo.findPasswordResetTokenByHash(tokenHash);

    if (!resetToken) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    // Fast-path rejections. Rows are kept (not deleted) like verification tokens;
    // forgotPasswordService clears a user's old tokens when a new one is issued.
    if (resetToken.consumedAt || resetToken.expiresAt < new Date()) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    // Hash outside the transaction so the slow bcrypt work doesn't hold a DB lock.
    const hashedPassword = await hashPassword(data.newPassword);
    // Single-use: the claim and password update are atomic, so a concurrent request
    // with the same token that got past the checks above loses the claim here.
    const claimed = await this.authRepo.claimPasswordResetTokenAndUpdatePassword(
      resetToken.id,
      resetToken.userId,
      hashedPassword
    );
    if (!claimed) {
      throw new AppError("Invalid or expired reset token", 400);
    }
  }
}
