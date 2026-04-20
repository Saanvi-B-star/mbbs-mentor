import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config';
import { prisma } from '@/config';

/**
 * API Request/Response Logging Middleware
 * Logs all API requests and optionally stores them in the database
 */
export const loggingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Store original send function
  const originalSend = res.send;

  // Create custom send function
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;

    // Log to console
    logger.info(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req.user as any)?.id,
      ip: req.ip,
    });

    // Async log to database (non-blocking)
    if (shouldLogToDatabase(req.path)) {
      logToDatabase(req, res, duration, data).catch((error) => {
        logger.error('Failed to log API request to database:', error);
      });
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Determine if request should be logged to database
 */
const shouldLogToDatabase = (path: string): boolean => {
  // Don't log health checks and some other routes
  const excludedPaths = ['/health', '/api/v1/health'];
  return !excludedPaths.includes(path);
};

/**
 * Log API request to database
 */
const logToDatabase = async (
  req: Request,
  res: Response,
  duration: number,
  responseData: any
): Promise<void> => {
  try {
    // Parse response data if it's a string
    let parsedResponse = responseData;
    if (typeof responseData === 'string') {
      try {
        parsedResponse = JSON.parse(responseData);
      } catch {
        // Keep as string if parsing fails
      }
    }

    await prisma.aPILog.create({
      data: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        requestBody: req.body || null,
        responseBody: res.statusCode >= 400 ? parsedResponse : null, // Only log response body on errors
        userId: (req.user as any)?.id || null,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        duration,
        errorMessage: res.statusCode >= 400 ? parsedResponse?.error?.message || null : null,
      },
    });
  } catch (error) {
    // Don't throw error, just log it
    logger.error('Failed to write API log to database:', error);
  }
};

/**
 * Request ID Middleware
 * Adds a unique request ID to each request
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
