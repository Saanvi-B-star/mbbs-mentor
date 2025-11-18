import { z } from 'zod';
import { DifficultyLevel } from '@prisma/client';

/**
 * Topic Validation Schemas
 */

/**
 * Create Topic Schema
 */
export const createTopicSchema = z.object({
  body: z.object({
    subjectId: z.string().cuid('Invalid subject ID format'),
    parentTopicId: z.string().cuid('Invalid parent topic ID format').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(200),
    description: z.string().optional(),
    difficultyLevel: z.nativeEnum(DifficultyLevel).optional(),
    estimatedStudyTime: z.number().int().min(1).optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

/**
 * Update Topic Schema
 */
export const updateTopicSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid topic ID format'),
  }),
  body: z.object({
    subjectId: z.string().cuid('Invalid subject ID format').optional(),
    parentTopicId: z.string().cuid('Invalid parent topic ID format').optional().nullable(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(200).optional(),
    description: z.string().optional(),
    difficultyLevel: z.nativeEnum(DifficultyLevel).optional().nullable(),
    estimatedStudyTime: z.number().int().min(1).optional().nullable(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

/**
 * Get Topic By ID Schema
 */
export const getTopicByIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid topic ID format'),
  }),
});

/**
 * Delete Topic Schema
 */
export const deleteTopicSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid topic ID format'),
  }),
});

/**
 * Get Topics By Subject Schema
 */
export const getTopicsBySubjectSchema = z.object({
  params: z.object({
    subjectId: z.string().cuid('Invalid subject ID format'),
  }),
});

/**
 * Get Topic Materials Schema
 */
export const getTopicMaterialsSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid topic ID format'),
  }),
});
