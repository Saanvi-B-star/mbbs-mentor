import { z } from 'zod';
import { TransactionType } from '@prisma/client';

/**
 * Token Validation Schemas
 */

/**
 * Deduct Tokens Schema
 */
export const deductTokensSchema = z.object({
  body: z.object({
    amount: z.number().int().positive('Amount must be a positive integer'),
    feature: z.string().min(1, 'Feature is required'),
    referenceId: z.string().optional(),
    description: z.string().optional(),
  }),
});

/**
 * Add Tokens Schema (Admin only)
 */
export const addTokensSchema = z.object({
  body: z.object({
    userId: z.string().cuid('Invalid user ID'),
    amount: z.number().int().positive('Amount must be a positive integer'),
    transactionType: z.nativeEnum(TransactionType),
    description: z.string().optional(),
    referenceId: z.string().optional(),
  }),
});

/**
 * Get Token Transactions Schema
 */
export const getTokenTransactionsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    transactionType: z.nativeEnum(TransactionType).optional(),
    startDate: z
      .string()
      .datetime()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    endDate: z
      .string()
      .datetime()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
  }),
});
