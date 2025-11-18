import rateLimit from 'express-rate-limit';
import { RATE_LIMIT, HTTP_STATUS } from '@/shared/constants';

/**
 * Global Rate Limiter
 * Applies to all routes
 */
export const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS, // 15 minutes
  max: RATE_LIMIT.MAX_REQUESTS, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: RATE_LIMIT.SKIP_SUCCESSFUL_REQUESTS,
  skipFailedRequests: RATE_LIMIT.SKIP_FAILED_REQUESTS,
});

/**
 * Auth Route Rate Limiter
 * More strict for authentication routes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Authentication rate limit exceeded',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * API Rate Limiter
 * For general API routes
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'API rate limit exceeded, please try again later.',
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'API rate limit exceeded',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File Upload Rate Limiter
 * For file upload routes
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    success: false,
    message: 'Upload limit exceeded, please try again later.',
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'File upload rate limit exceeded',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI Request Rate Limiter
 * For AI-powered features
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 AI requests per hour
  message: {
    success: false,
    message: 'AI request limit exceeded, please try again later.',
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI request rate limit exceeded',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
