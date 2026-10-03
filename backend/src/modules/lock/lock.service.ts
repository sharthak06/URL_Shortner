import { randomUUID } from "node:crypto";
import redis from "../../lib/redis.js";
import { logger } from "../../config/logger.js";
import {
  DEFAULT_LOCK_TTL_SECONDS,
  getLockKey,
  RELEASE_LOCK_LUA_SCRIPT,
} from "./lock.constants.js";
import { AcquireLockResult, ILockService } from "./lock.types.js";

export class LockService implements ILockService {
  
  async acquireLock(
    key: string,
    ttlSeconds: number = DEFAULT_LOCK_TTL_SECONDS
  ): Promise<AcquireLockResult> {
    const lockKey = getLockKey(key);
    const lockId = randomUUID();

    try {
      // SET key value EX ttl NX: only sets key if it does not already exist
      const result = await redis.set(lockKey, lockId, "EX", ttlSeconds, "NX");

      if (result === "OK") {
        logger.debug({
          event: "LOCK_ACQUIRED",
          key,
          lockKey,
          lockId,
          ttlSeconds,
        });
        return { acquired: true, lockId };
      }

      logger.debug({
        event: "LOCK_ACQUISITION_BUSY",
        key,
        lockKey,
      });
      return { acquired: false, lockId: null };
    } catch (error) {
      logger.error({
        event: "LOCK_ACQUIRE_ERROR",
        key,
        lockKey,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { acquired: false, lockId: null };
    }
  }

  /**
   * Safely releases the distributed lock using an atomic Lua script.
   * Verifies the stored lock token matches lockId before deleting,
   * preventing the process from releasing another node's lock if TTL expired.
   */
  async releaseLock(key: string, lockId: string): Promise<boolean> {
    const lockKey = getLockKey(key);

    try {
      const result = await redis.eval(
        RELEASE_LOCK_LUA_SCRIPT,
        1,
        lockKey,
        lockId
      );

      const released = result === 1;
      if (released) {
        logger.debug({
          event: "LOCK_RELEASED",
          key,
          lockKey,
          lockId,
        });
      } else {
        logger.warn({
          event: "LOCK_RELEASE_MISMATCH_OR_EXPIRED",
          key,
          lockKey,
          lockId,
        });
      }

      return released;
    } catch (error) {
      logger.error({
        event: "LOCK_RELEASE_ERROR",
        key,
        lockKey,
        lockId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  // Whether any holder currently has the lock. Reports false on Redis errors so a
  // waiter stops waiting and falls back rather than stalling on an unknown state.
  async isLocked(key: string): Promise<boolean> {
    const lockKey = getLockKey(key);

    try {
      return (await redis.exists(lockKey)) === 1;
    } catch (error) {
      logger.error({
        event: "LOCK_CHECK_ERROR",
        key,
        lockKey,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }
}
