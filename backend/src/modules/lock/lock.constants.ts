import { env } from "../../config/env.config.js";

export const LOCK_PREFIX = "lock:url";
export const DEFAULT_LOCK_TTL_SECONDS = Number(env.LOCK_TTL_SECONDS || 5);

export const getLockKey = (key: string): string => `${LOCK_PREFIX}:${key}`;

// Atomic Lua release script: releases the lock ONLY if the stored token matches the requester's lockId
export const RELEASE_LOCK_LUA_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
else
    return 0
end
`;
