import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { Response } from "express";
import ms from "ms";
import { env } from "../../config/env.config.js";
import { JwtPayloadType } from "./auth.types.js";

const saltRounds = Number(env.SALT_ROUNDS);

// 1. Password Hashing & Comparison
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Hashed once at startup with the same cost factor as real passwords, so comparing
// against it takes as long as a genuine check. Login runs it when no account matches,
// keeping response latency from revealing whether an email is registered.
const dummyPasswordHash = bcrypt.hash(crypto.randomBytes(16).toString("hex"), saltRounds);

export const compareAgainstDummyHash = async (password: string): Promise<void> => {
  await bcrypt.compare(password, await dummyPasswordHash);
};

// 2. Token Generation (Access & Refresh)
export const signAccessToken = (payload: JwtPayloadType): string => {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

export const signRefreshToken = (payload: JwtPayloadType): string => {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

// 3. Token Verification
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload;
};

// 4. Secure Cookie Management (HTTP-Only & CSRF-Safe)
const authCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export const setAccessTokenCookie = (res: Response, accessToken: string): void => {
  const accessTokenAge = ms(env.ACCESS_TOKEN_EXPIRES_IN as ms.StringValue);
  res.cookie("accessToken", accessToken, {
    ...authCookieOptions,
    maxAge: accessTokenAge,
  });
};

export const setAuthCookies = (
  res: Response,
  refreshToken: string,
  accessToken?: string
): void => {
  const refreshTokenAge = ms(env.REFRESH_TOKEN_EXPIRES_IN as ms.StringValue);

  res.cookie("refreshToken", refreshToken, {
    ...authCookieOptions,
    maxAge: refreshTokenAge,
  });

  if (accessToken) {
    setAccessTokenCookie(res, accessToken);
  }
};

// 5. High-Entropy Token Generation for Email Verification & Password Reset
// Raw token is emailed to the user; only its SHA-256 hash is persisted, so a DB
// leak never exposes a usable token. bcrypt is deliberately not used here -
// these tokens are already high-entropy random values (unlike user-chosen
// passwords), so a fast hash is correct and bcrypt's slowness is unnecessary cost.
export const generateRawToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashToken = (rawToken: string): string => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie("refreshToken", authCookieOptions);
  res.clearCookie("accessToken", authCookieOptions);
};
