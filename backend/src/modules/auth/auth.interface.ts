import {
  RegisterUserType,
  CreateHashedTokenType,
} from "./auth.types.js";
import { User, EmailVerificationToken, PasswordResetToken } from "@prisma/client";

export interface IAuthRepository {
  findUserById(id: string): Promise<User | null>;

  findUserByEmail(email: string): Promise<User | null>;

  createUser(data: RegisterUserType): Promise<User>;

  markEmailVerified(userId: string): Promise<User>;

  updateUserPassword(userId: string, passwordHash: string): Promise<User>;

  // Atomically replaces any existing verification tokens for the user with this one.
  issueEmailVerificationToken(
    data: CreateHashedTokenType
  ): Promise<EmailVerificationToken>;

  findEmailVerificationTokenByHash(
    tokenHash: string
  ): Promise<EmailVerificationToken | null>;

  consumeEmailVerificationToken(id: string): Promise<void>;

  createPasswordResetToken(
    data: CreateHashedTokenType
  ): Promise<PasswordResetToken>;

  findPasswordResetTokenByHash(
    tokenHash: string
  ): Promise<PasswordResetToken | null>;

  claimPasswordResetTokenAndUpdatePassword(
    tokenId: string,
    userId: string,
    passwordHash: string
  ): Promise<boolean>;

  deletePasswordResetTokensForUser(userId: string): Promise<void>;
}
