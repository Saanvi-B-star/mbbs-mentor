import { z } from 'zod';

/**
 * AI Validation Schemas
 */

/**
 * AI Chat Schema
 */
export const aiChatSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
    conversationId: z.string().cuid('Invalid conversation ID').optional(),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().max(4000).optional(),
  }),
});

/**
 * Generate Notes Schema
 */
export const generateNotesSchema = z.object({
  body: z.object({
    content: z.string().min(10, 'Content must be at least 10 characters').max(20000),
    topic: z.string().optional(),
    format: z.enum(['structured', 'bullet', 'detailed']).optional(),
  }),
});

/**
 * Generate Summary Schema
 */
export const generateSummarySchema = z.object({
  body: z.object({
    content: z.string().min(10, 'Content must be at least 10 characters').max(20000),
    maxLength: z.number().int().positive().max(1000).optional(),
  }),
});

/**
 * Generate Flashcards Schema
 */
export const generateFlashcardsSchema = z.object({
  body: z.object({
    content: z.string().min(10, 'Content must be at least 10 characters').max(20000),
    count: z.number().int().min(1).max(20).optional(),
    topic: z.string().optional(),
  }),
});

/**
 * Get Conversation Schema
 */
export const getConversationSchema = z.object({
  params: z.object({
    conversationId: z.string().cuid('Invalid conversation ID'),
  }),
});

/**
 * Get Conversations Schema
 */
export const getConversationsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
  }),
});

/**
 * Delete Conversation Schema
 */
export const deleteConversationSchema = z.object({
  params: z.object({
    conversationId: z.string().cuid('Invalid conversation ID'),
  }),
});
