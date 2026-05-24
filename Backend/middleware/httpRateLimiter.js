import redis from '../config/redis.js';

/**
 * Creates an Express rate limit middleware
 * @param {number} limit      - max requests allowed
 * @param {number} windowSec  - window in seconds
 * @param {string} prefix     - key prefix e.g. "login", "signup"
 */
export function httpRateLimit(limit, windowSec, prefix) {
  return async (req, res, next) => {
    try {
      // Use IP for auth routes — user isn't logged in yet
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const key = `${prefix}:${ip}`;

      const count = await redis.incr(key);

      // Set expiry on first request
      if (count === 1) {
        await redis.expire(key, windowSec);
      }

      const ttl = await redis.ttl(key);

      // Set standard rate limit headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));
      res.setHeader('X-RateLimit-Reset', ttl);

      if (count > limit) {
        return res.status(429).json({
          error: `Too many attempts. Try again in ${ttl} seconds.`,
          ttl,
        });
      }

      next();

    } catch (err) {
      // If Redis fails, fail open — don't block the user
      console.error('HTTP rate limiter error:', err.message);
      next();
    }
  };
}