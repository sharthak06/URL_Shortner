import { Redis } from "ioredis";
import { env } from "../config/env.config.js";
import { logger } from "../config/logger.js";
import { bloomService } from "../modules/bloom/bloom.container.js";

export const redisConnection = {    
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
};

export const redis = new Redis(redisConnection);

// 1. Emitted as soon as a TCP connection is established
redis.on("connect", () => {
  logger.info("Redis TCP connection established");
});

// 2. Emitted when Redis has completed initial handshake and is ready for commands
redis.on("ready", async () => {
  try {
    await bloomService.initialize();
  } catch (error) {
    logger.error({
      message: "Failed to initialize Bloom filter",
      error: error instanceof Error ? error.message : error,
    });
  }
  logger.info("Redis is ready to accept commands");
});

// 3. Emitted on connection drops or network failures
redis.on("error", (error) => {
  logger.error({
    message: "Redis connection error",
    error: error instanceof Error ? error.message : error,
  });
});

// 4. Emitted when connection is closed
redis.on("close", () => {
  logger.warn("Redis connection closed");
});

export default redis;
