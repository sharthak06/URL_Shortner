import bcrypt from "bcrypt";
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
export const setAuthCookies = (res: Response, refreshToken: string): void => {
  const refreshTokenAge = ms(env.REFRESH_TOKEN_EXPIRES_IN as ms.StringValue);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: refreshTokenAge,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  });
};
