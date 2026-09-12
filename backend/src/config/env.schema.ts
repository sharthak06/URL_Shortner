import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SALT_ROUNDS: z.coerce.number().default(10),
  ACCESS_TOKEN_SECRET: z.string().min(1, "ACCESS_TOKEN_SECRET is required"),
  REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET is required"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  URL_SHORTCODE_LENGTH: z.coerce.number().default(7),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  URL_CACHE_TTL: z.coerce.number(),
  JITTER_PERCENT: z.coerce.number(),

});

export type Env = z.infer<typeof envSchema>;
