import pino from "pino";
import { env } from "./env.config.js";

const isDevelopment = env.NODE_ENV === "development";

export const logger = pino({
  level: isDevelopment ? "debug" : "info",
  // Redact sensitive security fields from logs
  redact: {
    paths: [
      "password",
      "passwordHash",
      "accessToken",
      "refreshToken",
      "token",
      "authorization",
      "cookie",
      "headers.authorization",
      "headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  // In development, pipe through pino-pretty for clean and colored console logs
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export default logger;
