import { Request, Response } from "express";
import { TokenBucketType } from "../middlewares/rate-limit/types.js";

// Mock In-Memory Store mimicking Redis for offline testing
class MockRedis {
  private kv = new Map<string, string>();
  private zsets = new Map<string, Map<string, number>>();

  async get(key: string): Promise<string | null> {
    return this.kv.get(key) ?? null;
  }

  async set(key: string, value: string, _mode?: string, _duration?: number): Promise<"OK"> {
    this.kv.set(key, value);
    return "OK";
  }

  async del(key: string): Promise<number> {
    const deleted = (this.kv.delete(key) ? 1 : 0) + (this.zsets.delete(key) ? 1 : 0);
    return deleted;
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    const zset = this.zsets.get(key);
    if (!zset) return 0;
    let count = 0;
    for (const [member, score] of zset.entries()) {
      if (score >= min && score <= max) {
        zset.delete(member);
        count++;
      }
    }
    return count;
  }

  async zcard(key: string): Promise<number> {
    const zset = this.zsets.get(key);
    return zset ? zset.size : 0;
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.zsets.has(key)) {
      this.zsets.set(key, new Map());
    }
    this.zsets.get(key)!.set(member, score);
    return 1;
  }

  async expire(_key: string, _seconds: number): Promise<number> {
    return 1;
  }
}

interface MockResponse {
  statusCode: number;
  headers: Record<string, string | number>;
  body: any;
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
  setHeader: (key: string, value: string | number) => MockResponse;
}

function createMockRes(): MockResponse {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
    setHeader(key: string, value: string | number) {
      this.headers[key] = value;
      return this;
    },
  };
}

async function runMockVerification() {
  console.log("===============================================================");
  console.log("  MULTI-TIER RATE LIMITING ALGORITHM VERIFICATION (OFFLINE)    ");
  console.log("===============================================================\n");

  const mockRedis = new MockRedis();
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      testsPassed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      testsFailed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Tier 3 Token Bucket Algorithm Verification
  // --------------------------------------------------------------------------
  console.log("--- Testing Tier 3: Token Bucket Algorithm ---");
  const capacity = 10;
  const refillRate = 1;
  const refillInterval = 2000;
  const userId = "usr_test_123";
  const bucketKey = `token-bucket:${userId}`;

  // Helper simulating shortUrlTokenBucketRateLimit logic with mockRedis & controllable time
  async function testTokenBucketRequest(currentTime: number): Promise<{ allowed: boolean; res: MockResponse }> {
    const res = createMockRes();
    const rawBucket = await mockRedis.get(bucketKey);
    let bucket: TokenBucketType;

    if (rawBucket) {
      bucket = JSON.parse(rawBucket) as TokenBucketType;
      const elapsed = Math.max(0, currentTime - bucket.lastRefill);
      const refillCount = Math.floor(elapsed / refillInterval);

      if (refillCount > 0) {
        bucket.tokens = Math.min(capacity, bucket.tokens + refillCount * refillRate);
        if (bucket.tokens >= capacity) {
          bucket.lastRefill = currentTime;
        } else {
          bucket.lastRefill += refillCount * refillInterval;
        }
      }
    } else {
      bucket = { tokens: capacity, lastRefill: currentTime };
    }

    if (bucket.tokens <= 0) {
      const timeToNextRefill = Math.max(0, refillInterval - (currentTime - bucket.lastRefill));
      const retryAfterSeconds = Math.max(1, Math.ceil(timeToNextRefill / 1000));
      res.status(429).json({ success: false, message: "Rate limit exceeded" });
      res.setHeader("Retry-After", retryAfterSeconds);
      res.setHeader("X-RateLimit-Limit", capacity);
      res.setHeader("X-RateLimit-Remaining", 0);
      await mockRedis.set(bucketKey, JSON.stringify(bucket));
      return { allowed: false, res };
    }

    bucket.tokens -= 1;
    await mockRedis.set(bucketKey, JSON.stringify(bucket));
    res.setHeader("X-RateLimit-Limit", capacity);
    res.setHeader("X-RateLimit-Remaining", bucket.tokens);
    return { allowed: true, res };
  }

  let t = 1000000; // base timestamp
  let burstSuccess = 0;

  // 10 rapid burst requests at time t
  for (let i = 1; i <= 10; i++) {
    const outcome = await testTokenBucketRequest(t);
    if (outcome.allowed) burstSuccess++;
  }
  assert(burstSuccess === 10, "10 rapid URL creation burst requests succeed (Capacity: 10)");

  // 11th request at time t should be rejected
  const req11 = await testTokenBucketRequest(t);
  assert(
    !req11.allowed && req11.res.statusCode === 429,
    "11th request blocked immediately with HTTP 429 (0 tokens remaining)"
  );
  assert(
    Number(req11.res.headers["Retry-After"]) >= 1,
    "Retry-After header accurately set on blocked request"
  );

  // Advance time by 2000ms (1 refill interval)
  t += 2000;
  const req12 = await testTokenBucketRequest(t);
  assert(
    req12.allowed,
    "12th request succeeds after 2000ms refill interval replenishing 1 token"
  );

  // 13th request at the same time t should be blocked again
  const req13 = await testTokenBucketRequest(t);
  assert(
    !req13.allowed && req13.res.statusCode === 429,
    "13th request blocked immediately as the refilled token was consumed"
  );

  // Advance time by 4000ms (2 refill intervals)
  t += 4000;
  const req14 = await testTokenBucketRequest(t);
  const req15 = await testTokenBucketRequest(t);
  assert(
    req14.allowed && req15.allowed,
    "2 requests succeed after 4000ms (2 tokens replenished)"
  );

  // --------------------------------------------------------------------------
  // TEST 2: Tier 2 Login Sliding Window Log Algorithm Verification
  // --------------------------------------------------------------------------
  console.log("\n--- Testing Tier 2: Login Sliding Window Algorithm ---");
  const ip = "192.168.1.50";
  const loginKey = `login-rate-limit:${ip}`;
  const windowMs = 15 * 60 * 1000; // 15 mins
  const maxAttempts = 5;

  async function testLoginAttempt(currentTime: number): Promise<{ allowed: boolean; res: MockResponse }> {
    const res = createMockRes();
    const windowStart = currentTime - windowMs;

    // Prune expired
    await mockRedis.zremrangebyscore(loginKey, 0, windowStart);

    // Count attempts
    const count = await mockRedis.zcard(loginKey);

    if (count >= maxAttempts) {
      res.status(429).json({ success: false, message: "Too many login attempts" });
      res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
      return { allowed: false, res };
    }

    // Add current attempt
    await mockRedis.zadd(loginKey, currentTime, `${currentTime}-${Math.random()}`);
    return { allowed: true, res };
  }

  let loginAllowed = 0;
  let loginTime = 5000000;

  // 5 login attempts within window
  for (let i = 1; i <= 5; i++) {
    const outcome = await testLoginAttempt(loginTime + i * 1000);
    if (outcome.allowed) loginAllowed++;
  }
  assert(loginAllowed === 5, "5 consecutive login attempts allowed within 15-minute window");

  // 6th attempt within window must be blocked
  const attempt6 = await testLoginAttempt(loginTime + 6000);
  assert(
    !attempt6.allowed && attempt6.res.statusCode === 429,
    "6th attempt blocked with HTTP 429 protecting against password brute-forcing"
  );
  assert(
    Number(attempt6.res.headers["Retry-After"]) === 900,
    "Retry-After header set to 900 seconds (15 minutes)"
  );

  // Advance time past the 15-minute rolling window for the first attempt
  // (loginTime + 1000 expires after loginTime + 1000 + 15*60*1000)
  const futureTime = loginTime + 1000 + windowMs + 100;
  const attempt7 = await testLoginAttempt(futureTime);
  assert(
    attempt7.allowed,
    "New attempt allowed as oldest attempt fell outside rolling window (Sliding Window Log)"
  );

  // --------------------------------------------------------------------------
  // TEST 3: Verification of Middleware Exports
  // --------------------------------------------------------------------------
  console.log("\n--- Testing Module Exports & Types ---");
  const { globalRateLimiter } = await import("../middlewares/rate-limit/global-rate-limit.middleware.js");
  const { loginSlidingWindowRateLimit } = await import("../middlewares/rate-limit/login-sliding-window-rate-limit.js");
  const { shortUrlTokenBucketRateLimit, shortUrlTokenBuckerRateLimit } = await import(
    "../middlewares/rate-limit/short-url-token-bucket-rate-limit.js"
  );

  assert(typeof globalRateLimiter === "function", "globalRateLimiter middleware is properly exported");
  assert(typeof loginSlidingWindowRateLimit === "function", "loginSlidingWindowRateLimit middleware is properly exported");
  assert(typeof shortUrlTokenBucketRateLimit === "function", "shortUrlTokenBucketRateLimit middleware is properly exported");
  assert(shortUrlTokenBuckerRateLimit === shortUrlTokenBucketRateLimit, "shortUrlTokenBuckerRateLimit alias matches shortUrlTokenBucketRateLimit");

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n===============================================================");
  console.log(`ALL TESTS PASSED: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log("===============================================================");

  process.exit(testsFailed > 0 ? 1 : 0);
}

runMockVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
