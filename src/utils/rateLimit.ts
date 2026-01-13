// Rate limiting middleware for Hono
import type { Context, Next } from 'hono';

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // Read operations (GET) - more lenient
  READ: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests. Please try again later.',
  },
  // Write operations (POST, PATCH, DELETE) - stricter
  WRITE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many write requests. Please slow down.',
  },
  // Search operations - moderate
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Too many search requests. Please try again later.',
  },
} as const;

// In-memory store for rate limiting
// Note: In Cloudflare Workers, this is per-request isolation
// For production, consider using Cloudflare KV or Durable Objects
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Global store (will be reset per worker instance)
const rateLimitStore: RateLimitStore = {};

/**
 * Get client identifier for rate limiting
 */
function getClientId(c: Context): string {
  // Try to get IP from Cloudflare headers first
  const cfConnectingIp = c.req.header('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to other headers
  const forwardedFor = c.req.header('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = c.req.header('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Last resort: use a default identifier
  return 'unknown';
}

/**
 * Clean up expired entries from rate limit store
 */
function cleanupStore(): void {
  const now = Date.now();
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  }
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const clientId = getClientId(c);
    const now = Date.now();
    const key = `${clientId}:${config.windowMs}`;

    // Clean up expired entries periodically
    if (Math.random() < 0.1) {
      cleanupStore();
    }

    const record = rateLimitStore[key];

    if (!record || record.resetTime < now) {
      // Create new record or reset expired one
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      await next();
      return;
    }

    // Increment count
    record.count++;

    if (record.count > config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: config.message || 'Too many requests. Please try again later.',
            retryAfter,
          },
        },
        429,
        {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
        }
      );
    }

    // Add rate limit headers
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, config.maxRequests - record.count).toString());
    c.header('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    await next();
  };
}

/**
 * Rate limit middleware based on HTTP method
 */
export function rateLimitByMethod() {
  return async (c: Context, next: Next) => {
    const method = c.req.method;

    let config: RateLimitConfig;
    if (method === 'GET') {
      config = RATE_LIMITS.READ;
    } else if (method === 'POST' && c.req.path.includes('/search')) {
      config = RATE_LIMITS.SEARCH;
    } else if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      config = RATE_LIMITS.WRITE;
    } else {
      config = RATE_LIMITS.READ;
    }

    return rateLimit(config)(c, next);
  };
}
