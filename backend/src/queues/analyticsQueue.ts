import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { ANALYTICS_QUEUE_NAME, RECORD_CLICK_JOB } from "./queue.constants.js";
import { ClickJobPayload } from "./queue.types.js";
import { logger } from "../config/logger.js";

export const analyticsQueue = new Queue<ClickJobPayload>(ANALYTICS_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000, // 1s, 2s, 4s backoff on transient database issues
    },
    removeOnComplete: {
      count: 1000, // Preserve RAM: Keep only the latest 1,000 completed jobs
      age: 24 * 3600, // Evict after 24 hours
    },
    removeOnFail: false, // Retain failed jobs so the worker can inspect & route to DLQ
  },
});

// Helper for producers: provides a clean fail-open dispatch interface
export const addClickToAnalyticsQueue = async (
  payload: ClickJobPayload
): Promise<void> => {
  try {
    await analyticsQueue.add(RECORD_CLICK_JOB, payload);
  } catch (error) {
    logger.warn({
      event: "ANALYTICS_QUEUE_PUSH_FAILED_FAILING_OPEN",
      shortUrlId: payload.shortUrlId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
