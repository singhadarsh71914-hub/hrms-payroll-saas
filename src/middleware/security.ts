import rateLimit from 'express-rate-limit';

/**
 * Global API Rate Limiter
 * 100 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  skip: (req) => process.env.NODE_ENV !== "production"
});

console.log("NODE_ENV =", process.env.NODE_ENV);
console.log("Auth limiter enabled:", process.env.NODE_ENV === "production");

/**
 * Strict Auth Rate Limiter
 * 20 attempts per 5 minutes per IP (Relaxed for current session)
 * Used for Login, Refresh, Logout, and Password Reset
 */
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.'
  },
  // Skip successful logins so they don't count towards the limit
  skipSuccessfulRequests: true,
  // Skip failed requests if we only want to limit successful ones (usually false for auth)
  skipFailedRequests: false,
  // Development-only bypass
  skip: (req) => {
    const isSkip = process.env.NODE_ENV !== "production";
    console.log("RATE LIMIT SKIP =", isSkip);
    return isSkip;
  }
});
