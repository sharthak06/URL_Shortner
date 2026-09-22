import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { CACHE_WARMER_QUEUE_NAME } from "./queue.constants.js";

export const cacheWarmerQueue = new Queue(CACHE_WARMER_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600,
    },
    removeOnFail: {
      count: 200,
    },
  },
});
