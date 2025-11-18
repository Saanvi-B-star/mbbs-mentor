import { Request, Response, NextFunction } from 'express';
import { BaseException } from '@/shared/exceptions';
import { HTTP_STATUS, API_MESSAGES } from '@/shared/constants';
import { logger } from '@/config';
import { config } from '@/config';

/**
 * Global Error Handling Middleware
 * Catches all errors and returns standardized error responses
 */
export const errorMiddleware = (
  error: Error | BaseException,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle custom exceptions
  if (error instanceof BaseException) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        ...(config.isDevelopment && { stack: error.stack }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Resource already exists',
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'A resource with this unique field already exists',
          details: prismaError.meta,
        },
      });
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: API_MESSAGES.NOT_FOUND,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found',
        },
      });
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token',
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'The provided token is invalid',
      },
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Token expired',
      error: {
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'The provided token has expired',
      },
    });
  }

  // Handle validation errors (Zod)
  if (error.name === 'ZodError') {
    const zodError = error as any;
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: zodError.errors,
      },
    });
  }

  // Handle multer errors (file upload)
  if (error.name === 'MulterError') {
    const multerError = error as any;
    let message = 'File upload error';

    if (multerError.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum limit';
    } else if (multerError.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
    }

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message,
      },
    });
  }

  // Handle default errors
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: API_MESSAGES.INTERNAL_ERROR,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.isDevelopment ? error.message : 'An unexpected error occurred',
      ...(config.isDevelopment && { stack: error.stack }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
};
