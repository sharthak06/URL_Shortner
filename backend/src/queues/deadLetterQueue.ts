import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { ANALYTICS_DLQ_NAME } from "./queue.constants.js";
import { DeadLetterJobPayload } from "./queue.types.js";
import { logger } from "../config/logger.js";

export const deadLetterQueue = new Queue<DeadLetterJobPayload>(
  ANALYTICS_DLQ_NAME,
  {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: {
        count: 5000, // Retain up to 5,000 DLQ jobs for post-mortem analysis
      },
      removeOnFail: false,
    },
  }
);

// Helper for routing dead jobs after all retries are exhausted
export const forwardToDeadLetterQueue = async (
  payload: DeadLetterJobPayload
): Promise<void> => {
  try {
    await deadLetterQueue.add("dead-letter-click", payload);
    logger.error({
      event: "JOB_FORWARDED_TO_DLQ",
      shortUrlId: payload.originalJob.shortUrlId,
      failedReason: payload.failedReason,
      attemptsMade: payload.attemptsMade,
    });
  } catch (error) {
    logger.error({
      event: "CRITICAL_DLQ_PUSH_FAILED",
      shortUrlId: payload.originalJob.shortUrlId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
