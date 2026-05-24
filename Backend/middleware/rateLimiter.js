import redis from '../config/redis.js';

/**
 * @param {string} key      - unique identifier e.g. "msg:userId123"
 * @param {number} limit    - max requests allowed in window
 * @param {number} windowSec - window size in SECONDS
 */
export async function isRateLimited(key, limit, windowSec) {
  try {
    // Atomically increment the counter
    const count = await redis.incr(key);

    // First request — set the expiry window
    if (count === 1) {
      await redis.expire(key, windowSec);
    }

    // Get remaining time for response info
    const ttl = await redis.ttl(key);

    if (count > limit) {
      return {
        limited: true,
        count,
        remaining: 0,
        ttl,        // seconds until reset
      };
    }

    return {
      limited: false,
      count,
      remaining: limit - count,
      ttl,
    };

  } catch (err) {
    // If Redis fails, fail open (don't block users)
    console.error('Rate limiter error:', err.message);
    return { limited: false, count: 0, remaining: limit, ttl: 0 };
  }
}