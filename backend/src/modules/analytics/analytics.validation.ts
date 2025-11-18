import { z } from 'zod';

/**
 * Analytics Validation Schemas
 */

/**
 * Get Test Analytics Schema
 */
export const getTestAnalyticsSchema = z.object({
  params: z.object({
    attemptId: z.string().uuid('Invalid attempt ID'),
  }),
});

/**
 * Date Range Schema
 */
export const dateRangeSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

/**
 * Study Time Period Schema
 */
export const studyTimePeriodSchema = z.object({
  query: z.object({
    period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
  }),
});

/**
 * Platform Analytics Date Range Schema
 */
export const platformAnalyticsSchema = z.object({
  query: z.object({
    days: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 30)),
  }),
});

/**
 * Revenue Stats Schema
 */
export const revenueStatsSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});
