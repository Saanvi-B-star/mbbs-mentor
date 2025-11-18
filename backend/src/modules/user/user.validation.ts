import { z } from 'zod';

/**
 * User Validation Schemas
 */

/**
 * Update User Profile Schema
 */
export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    profilePicture: z.string().url('Invalid profile picture URL').optional(),
    mbbsYear: z.number().int().min(1).max(5).optional(),
    college: z.string().optional(),
    university: z.string().optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format')
      .optional(),
    dateOfBirth: z
      .string()
      .datetime()
      .or(z.date())
      .optional()
      .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  }),
});

/**
 * Get User By ID Schema
 */
export const getUserByIdSchema = z.object({
  params: z.object({
    userId: z.string().cuid('Invalid user ID format'),
  }),
});

/**
 * Delete Account Schema
 */
export const deleteAccountSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required'),
    reason: z.string().optional(),
  }),
});
