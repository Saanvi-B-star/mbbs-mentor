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

/**
 * Search Notes Schema
 */
export const searchNotesSchema = z.object({
  query: z.object({
    searchTerm: z.string().min(1).optional(),
    tags: z.string().transform(val => val && val.split(',')).optional(),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
    sortBy: z.enum(['createdAt', 'title', 'wordCount', 'fileSize']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

/**
 * Extract by Tags Schema
 */
export const extractByTagsSchema = z.object({
  body: z.object({
    tags: z.array(z.string().min(1)).min(1),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(10),
  }),
});

/**
 * Extract by Date Range Schema
 */
export const extractByDateRangeSchema = z.object({
  body: z.object({
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(10),
  }),
});

/**
 * Extract by Status Schema
 */
export const extractByStatusSchema = z.object({
  params: z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  }),
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
  }),
});

/**
 * Get Processed Notes Schema
 */
export const getProcessedNotesSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
  }),
});

/**
 * Export Notes Schema
 */
export const exportNotesSchema = z.object({
  query: z.object({
    format: z.enum(['json', 'csv']).optional().default('json'),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
    tags: z.string().transform(val => val && val.split(',')).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

/**
 * Extract by Topic Schema
 */
export const extractByTopicSchema = z.object({
  params: z.object({
    topicId: z.string().cuid(),
  }),
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
  }),
});

/**
 * Extract by Subject Schema
 */
export const extractBySubjectSchema = z.object({
  params: z.object({
    subjectId: z.string().cuid(),
  }),
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
  }),
});

/**
 * Get Notes by Subject Tree Schema
 */
export const getNotesBySubjectTreeSchema = z.object({
  params: z.object({
    subjectId: z.string().cuid(),
  }),
});
