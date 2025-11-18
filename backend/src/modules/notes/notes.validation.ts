import { z } from 'zod';

/**
 * Notes Validation Schemas
 */

/**
 * Upload Note Schema
 */
export const uploadNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    tags: z.array(z.string()).max(10).optional(),
  }),
});

/**
 * Update Note Schema
 */
export const updateNoteSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    tags: z.array(z.string()).max(10).optional(),
    isPublic: z.boolean().optional(),
    allowDownload: z.boolean().optional(),
  }),
});

/**
 * Get Note Schema
 */
export const getNoteSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

/**
 * Delete Note Schema
 */
export const deleteNoteSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

/**
 * Generate Flashcards Schema
 */
export const generateFlashcardsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    count: z.number().int().min(5).max(50).optional().default(10),
  }),
});
