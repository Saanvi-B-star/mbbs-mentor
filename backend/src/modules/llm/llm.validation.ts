/**
 * LLM Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod';

export const chatSchema = z.object({
  body: z.object({
    question: z
      .string()
      .min(3, 'Question must be at least 3 characters')
      .max(2000, 'Question must not exceed 2000 characters')
      .trim(),
  }),
});

export const getHistorySchema = z.object({
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  }),
});

export type ChatSchemaType = z.infer<typeof chatSchema>;
export type GetHistorySchemaType = z.infer<typeof getHistorySchema>;
