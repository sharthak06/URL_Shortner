import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import redis from "../../lib/redis.js";
import { env } from "../../config/env.config.js";
import { logger } from "../../config/logger.js";

type SlidingWindowOptions = {
  keyPrefix: string;
  windowMinutes: number;
  maxAttempts: number;
  eventName: string;
  message: (windowMinutes: number) => string;
  getEmail?: (req: Request) => string | undefined;
};

/**
 * Sliding Window Log Rate Limiter (Redis ZSET) for abuse-prone email endpoints
 * (forgot-password, resend-verification).
 *
 * Implements dual-key protection (Defense in Depth):
 * 1. Target Email key (`${keyPrefix}:${normalizedEmail}`) prevents inbox flooding/bombing
 *    of a victim's email even if an attacker rotates source IPs (proxy networks, botnets).
 * 2. Client IP key (`${keyPrefix}:${clientIp}`) prevents a single attacker IP from spraying
 *    requests across multiple accounts and exhausting transactional email provider limits.
 *
 * If `req.body.email` is missing or invalid, it gracefully falls back to IP-only rate limiting
 * without crashing or throwing errors.
 */
export const createSlidingWindowRateLimit = (options: SlidingWindowOptions) => {
  const { keyPrefix, windowMinutes, maxAttempts, eventName, message, getEmail } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";

    // Extract and defensively normalize target email
    const rawEmail = getEmail ? getEmail(req) : (req.body?.email as unknown);
    const normalizedEmail =
      typeof rawEmail === "string" && rawEmail.trim().length > 0
        ? rawEmail.trim().toLowerCase()
        : undefined;

    // Keys: IP key is always present; Email key is present when valid email is provided
    const ipKey = `${keyPrefix}:${clientIp}`;
    const emailKey = normalizedEmail ? `${keyPrefix}:${normalizedEmail}` : null;

    const windowMs = windowMinutes * 60 * 1000;
    const windowSeconds = Math.ceil(windowMs / 1000);
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // 1. Prune expired attempts and count attempts in pipeline
      const checkPipeline = redis.pipeline();
      if (emailKey) {
        checkPipeline.zremrangebyscore(emailKey, 0, windowStart);
        checkPipeline.zcard(emailKey);
      }
      checkPipeline.zremrangebyscore(ipKey, 0, windowStart);
      checkPipeline.zcard(ipKey);

      const results = await checkPipeline.exec();
      if (!results) {
        throw new Error("Redis pipeline execution failed");
      }

      let emailAttempts = 0;
      let ipAttempts = 0;

      if (emailKey) {
        // [0] zremrangebyscore, [1] zcard for emailKey
        const [emailErr, emailCount] = results[1];
        if (emailErr) throw emailErr as Error;
        emailAttempts = typeof emailCount === "number" ? emailCount : 0;

        // [2] zremrangebyscore, [3] zcard for ipKey
        const [ipErr, ipCount] = results[3];
        if (ipErr) throw ipErr as Error;
        ipAttempts = typeof ipCount === "number" ? ipCount : 0;
      } else {
        // [0] zremrangebyscore, [1] zcard for ipKey
        const [ipErr, ipCount] = results[1];
        if (ipErr) throw ipErr as Error;
        ipAttempts = typeof ipCount === "number" ? ipCount : 0;
      }

      // 2. Reject if target email limit reached (prevents victim flooding across multiple IPs)
      if (emailKey && emailAttempts >= maxAttempts) {
        logger.warn({
          event: eventName,
          limitType: "email",
          email: normalizedEmail,
          ip: clientIp,
          attempts: emailAttempts,
          maxAttempts,
        });

        res.setHeader("Retry-After", windowSeconds);
        return res.status(429).json({
          success: false,
          message: message(windowMinutes),
        });
      }

      // 3. Reject if client IP limit reached (defense in depth against spray from single IP)
      if (ipAttempts >= maxAttempts) {
        logger.warn({
          event: eventName,
          limitType: "ip",
          email: normalizedEmail,
          ip: clientIp,
          attempts: ipAttempts,
          maxAttempts,
        });

        res.setHeader("Retry-After", windowSeconds);
        return res.status(429).json({
          success: false,
          message: message(windowMinutes),
        });
      }

      // 4. Record current attempt on active keys
      const member = `${now}-${randomUUID()}`;
      const recordPipeline = redis.pipeline();

      if (emailKey) {
        recordPipeline.zadd(emailKey, now, member);
        recordPipeline.expire(emailKey, windowSeconds);
      }
      recordPipeline.zadd(ipKey, now, member);
      recordPipeline.expire(ipKey, windowSeconds);

      await recordPipeline.exec();

      return next();
    } catch (error) {
      logger.error({
        event: `${eventName}_ERROR`,
        ip: clientIp,
        email: normalizedEmail,
        error: error instanceof Error ? error.message : error,
      });
      return next(error);
    }
  };
};

export const forgotPasswordRateLimit = createSlidingWindowRateLimit({
  keyPrefix: "forgot-password-rate-limit",
  windowMinutes: env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW,
  maxAttempts: env.FORGOT_PASSWORD_RATE_LIMIT_SIZE,
  eventName: "FORGOT_PASSWORD_RATE_LIMIT_EXCEEDED",
  message: (windowMinutes) =>
    `Too many password reset requests. Please try again after ${windowMinutes} minutes.`,
});

export const resendVerificationRateLimit = createSlidingWindowRateLimit({
  keyPrefix: "resend-verification-rate-limit",
  windowMinutes: env.RESEND_VERIFICATION_RATE_LIMIT_WINDOW,
  maxAttempts: env.RESEND_VERIFICATION_RATE_LIMIT_SIZE,
  eventName: "RESEND_VERIFICATION_RATE_LIMIT_EXCEEDED",
  message: (windowMinutes) =>
    `Too many verification email requests. Please try again after ${windowMinutes} minutes.`,
});
