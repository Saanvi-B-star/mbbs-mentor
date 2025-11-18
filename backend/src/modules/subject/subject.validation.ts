import { z } from 'zod';

/**
 * Subject Validation Schemas
 */

/**
 * Create Subject Schema
 */
export const createSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    code: z.string().min(2, 'Code must be at least 2 characters').max(20),
    description: z.string().optional(),
    iconUrl: z.string().url('Invalid icon URL').optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use hex color)').optional(),
    mbbsYear: z.number().int().min(1).max(5).optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

/**
 * Update Subject Schema
 */
export const updateSubjectSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid subject ID format'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    code: z.string().min(2, 'Code must be at least 2 characters').max(20).optional(),
    description: z.string().optional(),
    iconUrl: z.string().url('Invalid icon URL').optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use hex color)').optional(),
    mbbsYear: z.number().int().min(1).max(5).optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

/**
 * Get Subject By ID Schema
 */
export const getSubjectByIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid subject ID format'),
  }),
});

/**
 * Delete Subject Schema
 */
export const deleteSubjectSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid subject ID format'),
  }),
});

/**
 * Get Subject Topics Schema
 */
export const getSubjectTopicsSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid subject ID format'),
  }),
});
