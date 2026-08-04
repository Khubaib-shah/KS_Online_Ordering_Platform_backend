// ─── Rate Limiting Middleware ────────────────────────────────────────
// Protects against brute-force attacks and abuse on sensitive endpoints.

import rateLimit from 'express-rate-limit';

/**
 * Auth rate limiter: 10 requests per 15 minutes per IP.
 * Protects POST /auth/login against brute-force password attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    },
  },
});

/**
 * Order creation rate limiter: 20 requests per minute per IP.
 * Prevents order-flooding on the public website endpoint.
 */
export const orderCreationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many order requests. Please try again shortly.',
    },
  },
});

/**
 * Staff invite rate limiter: 5 requests per hour per IP.
 * Prevents mass account creation via the invite endpoint.
 */
export const staffInviteRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many invite attempts. Please try again later.',
    },
  },
});
