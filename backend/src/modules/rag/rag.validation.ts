/**
 * RAG Module Validation Schemas
 */

import { z } from 'zod';

export const queryRagSchema = z.object({
  body: z.object({
    query: z.string().min(3).max(1000),
    conversationId: z.string().optional(),
  }),
});

