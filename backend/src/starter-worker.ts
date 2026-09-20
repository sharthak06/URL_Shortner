import { createAnalyticsWorker } from "./workers/analyticsWorker.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import { logger } from "./config/logger.js";

logger.info("Initializing Analytics Background Worker...");

const worker = createAnalyticsWorker({ concurrency: 5 });

logger.info({
  event: "WORKER_STARTED",
  concurrency: 5,
  message: "Analytics Worker is running and listening for click events.",
});

// Graceful Shutdown Handler: allows active jobs to finish cleanly without data corruption
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully stopping worker process...`);

  try {
    // 1. Stop taking new jobs and wait for active jobs to complete
    await worker.close();
    logger.info("BullMQ worker closed.");

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
