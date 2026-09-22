import { createAnalyticsWorker } from "./workers/analyticsWorker.js";
import { createCacheWarmerWorker } from "./workers/cacheWarmerWorker.js";
import { cacheWarmerQueue } from "./queues/cacheWarmerQueue.js";
import {
  CACHE_WARMER_SCHEDULER_ID,
  WARM_CACHE_JOB,
} from "./queues/queue.constants.js";
import { env } from "./config/env.config.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import { logger } from "./config/logger.js";

logger.info("Initializing Background Workers...");

// 1. Start Click Analytics Ingestion Worker
const analyticsWorker = createAnalyticsWorker({ concurrency: 5 });

logger.info({
  event: "WORKER_STARTED",
  worker: "AnalyticsWorker",
  concurrency: 5,
  message: "Analytics Worker is running and listening for click events.",
});

// 2. Start Proactive Cache Warmer Worker
const cacheWarmerWorker = createCacheWarmerWorker({ concurrency: 1 });

logger.info({
  event: "WORKER_STARTED",
  worker: "CacheWarmerWorker",
  concurrency: 1,
  message: "Cache Warmer Worker is running and ready for scheduled warming jobs.",
});

// 3. Register Recurring Cache Warmer Job Scheduler
const initScheduler = async (): Promise<void> => {
  const warmerIntervalMs =
    Number(env.CACHE_WARMER_EVERY_MINUTES || 15) * 60 * 1000;

  try {
    await cacheWarmerQueue.upsertJobScheduler(
      CACHE_WARMER_SCHEDULER_ID,
      { every: warmerIntervalMs },
      { name: WARM_CACHE_JOB }
    );
    logger.info({
      event: "CACHE_WARMER_SCHEDULER_REGISTERED",
      schedulerId: CACHE_WARMER_SCHEDULER_ID,
      intervalMs: warmerIntervalMs,
      everyMinutes: env.CACHE_WARMER_EVERY_MINUTES,
    });
  } catch (error) {
    logger.error({
      event: "CACHE_WARMER_SCHEDULER_REGISTRATION_FAILED",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

initScheduler();

// Graceful Shutdown Handler: allows active jobs to finish cleanly without data corruption
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully stopping worker processes...`);

  try {
    // 1. Stop taking new jobs and wait for active jobs to complete
    await Promise.all([
      analyticsWorker.close(),
      cacheWarmerWorker.close(),
      cacheWarmerQueue.close(),
    ]);
    logger.info("All BullMQ workers and queues closed cleanly.");

    // 2. Disconnect Prisma DB pool cleanly
    await prisma.$disconnect();
    logger.info("Prisma disconnected.");

    // 3. Close Redis connection
    await redis.quit();
    logger.info("Redis connection closed.");

    logger.info("Graceful shutdown completed. Exiting.");
    process.exit(0);
  } catch (error) {
    logger.error({
      event: "WORKER_SHUTDOWN_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  }
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
