// ─── Rate Limiting Middleware ────────────────────────────────────────
// Protects against brute-force attacks and abuse on sensitive endpoints.

import rateLimit from "express-rate-limit";

const buildTenantKey = (req: any) => {
  const tenantId =
    req.tenantId ||
    req.query?.tenantId ||
    req.query?.tenantSlug ||
    req.headers?.["x-tenant-id"] ||
    req.headers?.["x-tenant-slug"];
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  return `${tenantId ?? "public"}:${Array.isArray(ip) ? ip[0] : ip}`;
};

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
      code: "RATE_LIMITED",
      message: "Too many login attempts. Please try again in 15 minutes.",
    },
  },
});

/**
 * Order creation rate limiter: 20 requests per minute per tenant+IP.
 * Keeps the same numeric ceiling but scopes it per tenant and client IP.
 */
export const orderCreationRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: buildTenantKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many order requests. Please try again shortly.",
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
      code: "RATE_LIMITED",
      message: "Too many invite attempts. Please try again later.",
    },
  },
});
