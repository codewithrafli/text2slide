/**
 * Rate limiting using Upstash Redis
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RateLimitError } from '@/lib/errors';

let ratelimit: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Upstash Redis not configured, rate limiting disabled');
    return null;
  }

  const redis = new Redis({ url, token });
  const limit = parseInt(process.env.RATE_LIMIT_PER_DAY || '5', 10);

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, '24 h'),
    analytics: true,
  });

  return ratelimit;
}

/**
 * Check rate limit for an IP address
 * Throws RateLimitError if exceeded
 */
export async function checkRateLimit(
  ip: string
): Promise<{ remaining: number }> {
  const limiter = getRateLimiter();

  // If no Redis configured, allow all (dev mode)
  if (!limiter) {
    return { remaining: 999 };
  }

  const { success, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    throw new RateLimitError(remaining, reset);
  }

  return { remaining };
}

/**
 * Hash IP for privacy - we store hash, not raw IP
 */
export function hashIp(ip: string): string {
  // Simple hash for privacy - not cryptographically secure, just for anonymization
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `ip_${Math.abs(hash).toString(16)}`;
}
