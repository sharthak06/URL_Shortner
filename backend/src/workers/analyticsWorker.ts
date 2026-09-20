import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { ANALYTICS_QUEUE_NAME } from "../queues/queue.constants.js";
import { ClickJobPayload } from "../queues/queue.types.js";
import { analyticsService } from "../modules/analytics/analytics.container.js";
import { forwardToDeadLetterQueue } from "../queues/deadLetterQueue.js";
import { logger } from "../config/logger.js";
import { WorkerConfig } from "./workers.types.js";

// Core job processor: consumes job and invokes analytics service data layer
export const processAnalyticsJob = async (
  job: Job<ClickJobPayload>
): Promise<void> => {
  const { shortUrlId, ipAddress, userAgent, referrer, country, clickedAt } =
    job.data;

  const parsedDate = clickedAt ? new Date(clickedAt) : new Date();

  await analyticsService.recordClick({
    shortUrlId,
    ipAddress,
    userAgent,
    referrer,
    country,
    clickedAt: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
  });
};

export const createAnalyticsWorker = (
  config: WorkerConfig = { concurrency: 5 }
): Worker<ClickJobPayload> => {
  const worker = new Worker<ClickJobPayload>(
    ANALYTICS_QUEUE_NAME,
    processAnalyticsJob,
    {
      connection: redisConnection,
      concurrency: config.concurrency,
    }
  );

  // 1. Success event
  worker.on("completed", (job: Job<ClickJobPayload>) => {
    logger.info({
      event: "ANALYTICS_JOB_PROCESSED",
      jobId: job.id,
      shortUrlId: job.data.shortUrlId,
    });
  });

  // 2. Retry / Failure event with Dead Letter Queue forwarding
  worker.on(
    "failed",
    async (job: Job<ClickJobPayload> | undefined, error: Error) => {
      if (!job) {
        logger.error({
          event: "UNKNOWN_JOB_FAILED",
          error: error.message,
        });
        return;
      }

      logger.warn({
        event: "ANALYTICS_JOB_ATTEMPT_FAILED",
        jobId: job.id,
        shortUrlId: job.data.shortUrlId,
        attempt: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        error: error.message,
      });

      // When all retries are exhausted, isolate the job in the DLQ
      const maxAttempts = job.opts.attempts ?? 3;
      if (job.attemptsMade >= maxAttempts) {
        await forwardToDeadLetterQueue({
          originalJob: job.data,
          failedReason: error.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
          stacktrace: job.stacktrace,
        });
      }
    }
  );

  // 3. Worker-level errors (e.g. connection drops)
  worker.on("error", (error: Error) => {
    logger.error({
      event: "ANALYTICS_WORKER_ERROR",
      error: error.message,
    });
  });

  return worker;
};
