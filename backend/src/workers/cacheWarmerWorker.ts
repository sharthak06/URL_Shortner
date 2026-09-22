import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { CACHE_WARMER_QUEUE_NAME } from "../queues/queue.constants.js";
import { cacheWarmerService } from "../modules/url/cache/cache-warmer.container.js";
import { env } from "../config/env.config.js";
import { logger } from "../config/logger.js";
import { WorkerConfig } from "./workers.types.js";

export const processCacheWarmerJob = async (
  job: Job
): Promise<{ warmedCount: number }> => {
  logger.info({
    event: "CACHE_WARMER_JOB_STARTED",
    jobId: job.id,
    jobName: job.name,
  });

  const limit = Number(env.WARM_HOT_URLS_LIMIT || 50);
  const result = await cacheWarmerService.warmHotUrls(limit);

  return result;
};

export const createCacheWarmerWorker = (
  config: WorkerConfig = { concurrency: 1 }
): Worker => {
  const worker = new Worker(
    CACHE_WARMER_QUEUE_NAME,
    processCacheWarmerJob,
    {
      connection: redisConnection,
      concurrency: config.concurrency,
    }
  );

  worker.on("completed", (job: Job, result: { warmedCount: number }) => {
    logger.info({
      event: "CACHE_WARMER_JOB_COMPLETED",
      jobId: job.id,
      warmedCount: result?.warmedCount ?? 0,
    });
  });

  worker.on("failed", (job: Job | undefined, error: Error) => {
    logger.error({
      event: "CACHE_WARMER_JOB_FAILED",
      jobId: job?.id,
      error: error.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  worker.on("error", (error: Error) => {
    logger.error({
      event: "CACHE_WARMER_WORKER_ERROR",
      error: error.message,
    });
  });

  return worker;
};
