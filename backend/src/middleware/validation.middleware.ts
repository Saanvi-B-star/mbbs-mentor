import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationException } from '@/shared/exceptions';

/**
 * Validation Middleware Factory
 * Creates middleware that validates request data against a Zod schema
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return next(new ValidationException('Validation failed', 'VALIDATION_FAILED', errors));
      }
      next(error);
    }
  };
};

/**
 * Validate Request Body
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return next(new ValidationException('Request body validation failed', 'VALIDATION_FAILED', errors));
      }
      next(error);
    }
  };
};

/**
 * Validate Query Parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return next(new ValidationException('Query parameters validation failed', 'VALIDATION_FAILED', errors));
      }
      next(error);
    }
  };
};

/**
 * Validate URL Parameters
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return next(new ValidationException('URL parameters validation failed', 'VALIDATION_FAILED', errors));
      }
      next(error);
    }
  };
};
