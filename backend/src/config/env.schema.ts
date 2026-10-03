import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  // When true, the API process also boots the BullMQ workers in-process
  // (used on single-service hosts like Render free tier, where a separate
  // worker process isn't available). Keep false to run the worker separately.
  RUN_WORKER_IN_PROCESS: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SALT_ROUNDS: z.coerce.number().default(10),
  ACCESS_TOKEN_SECRET: z.string().min(1, "ACCESS_TOKEN_SECRET is required"),
  REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET is required"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  URL_SHORTCODE_LENGTH: z.coerce.number().default(7),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  REDIS_PASSWORD: z.string().optional(),
  URL_CACHE_TTL: z.coerce.number(),
  JITTER_PERCENT: z.coerce.number(),

  // Distributed Lock Tuning
  LOCK_TTL_SECONDS: z.coerce.number().default(5),

  // Proactive Cache Warmer Configuration
  HOT_URL_CACHE_TTL_HOURS: z.coerce.number().default(24),
  CACHE_WARMER_EVERY_MINUTES: z.coerce.number().default(15),
  WARM_HOT_URLS_LIMIT: z.coerce.number().default(50),

  // Multi-Tier Rate Limiting Configuration
  GLOBAL_RATE_LIMIT_WINDOW: z.coerce.number().default(15), // minutes
  GLOBAL_RATE_LIMIT_SIZE: z.coerce.number().default(100), // requests per window
  LOGIN_RATE_LIMIT_WINDOW: z.coerce.number().default(15), // minutes
  LOGIN_RATE_LIMIT_SIZE: z.coerce.number().default(5), // max attempts
  SHORT_URL_TOKEN_BUCKET_CAPACITY: z.coerce.number().default(10), // burst capacity
  SHORT_URL_TOKEN_REFILL_RATE: z.coerce.number().default(1), // tokens refilled
  SHORT_URL_TOKEN_REFILL_INTERVAL: z.coerce.number().default(2000), // ms (1 token every 2s)
  FORGOT_PASSWORD_RATE_LIMIT_WINDOW: z.coerce.number().default(15), // minutes
  FORGOT_PASSWORD_RATE_LIMIT_SIZE: z.coerce.number().default(3), // max attempts
  RESEND_VERIFICATION_RATE_LIMIT_WINDOW: z.coerce.number().default(15), // minutes
  RESEND_VERIFICATION_RATE_LIMIT_SIZE: z.coerce.number().default(3), // max attempts

  // Transactional Email (Resend)
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),
  EMAIL_VERIFICATION_TOKEN_EXPIRES_IN: z.string().default("24h"),
  PASSWORD_RESET_TOKEN_EXPIRES_IN: z.string().default("30m"),
});

export type Env = z.infer<typeof envSchema>;
