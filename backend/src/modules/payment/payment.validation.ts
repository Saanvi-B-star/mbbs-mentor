import { z } from 'zod';
import { PaymentStatus } from '@prisma/client';

/**
 * Payment Validation Schemas
 */

/**
 * Create Order Schema
 */
export const createOrderSchema = z.object({
  body: z.object({
    planId: z.string().cuid('Invalid plan ID'),
    currency: z.string().default('INR').optional(),
  }),
});

/**
 * Verify Payment Schema
 */
export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
    razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
  }),
});

/**
 * Webhook Schema
 */
export const webhookSchema = z.object({
  body: z.object({
    event: z.string().min(1, 'Event type is required'),
    payload: z.any(),
  }),
  headers: z.object({
    'x-razorpay-signature': z.string().min(1, 'Webhook signature is required'),
  }),
});

/**
 * Get Payment History Schema
 */
export const getPaymentHistorySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    status: z.nativeEnum(PaymentStatus).optional(),
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
