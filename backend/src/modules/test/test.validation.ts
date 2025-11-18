import { z } from 'zod';
import { TestType, DifficultyLevel, QuestionType } from '@prisma/client';

/**
 * Test Validation Schemas
 * Zod schemas for validating test-related inputs
 */

// Generate test schema
export const generateTestSchema = z.object({
  body: z
    .object({
      title: z.string().optional(),
      testType: z.nativeEnum(TestType, {
        errorMap: () => ({ message: 'Invalid test type' }),
      }),
      subjectIds: z.array(z.string()).optional(),
      topicIds: z.array(z.string()).optional(),
      totalQuestions: z
        .number()
        .int()
        .min(1, 'At least 1 question required')
        .max(200, 'Maximum 200 questions allowed'),
      duration: z.number().int().min(1).max(600).optional(), // Max 10 hours
      difficultyLevel: z.nativeEnum(DifficultyLevel).optional(),
      questionTypes: z.array(z.nativeEnum(QuestionType)).optional(),
    })
    .refine(
      (data) => {
        // At least one of subjectIds or topicIds must be provided
        return (
          (data.subjectIds && data.subjectIds.length > 0) ||
          (data.topicIds && data.topicIds.length > 0)
        );
      },
      {
        message: 'Either subjectIds or topicIds must be provided',
        path: ['topicIds'],
      }
    ),
});

// Get test by ID schema
export const getTestByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Test ID is required'),
  }),
});

// Start test schema
export const startTestSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Test ID is required'),
  }),
});

// Submit answer schema
export const submitAnswerSchema = z.object({
  params: z.object({
    attemptId: z.string().min(1, 'Attempt ID is required'),
  }),
  body: z.object({
    questionId: z.string().min(1, 'Question ID is required'),
    selectedOptionId: z.string().optional(),
    answerText: z.string().optional(),
    timeTaken: z.number().int().min(0).optional(),
    isFlagged: z.boolean().optional().default(false),
  }),
});

// Submit test schema
export const submitTestSchema = z.object({
  params: z.object({
    attemptId: z.string().min(1, 'Attempt ID is required'),
  }),
});

// Get test results schema
export const getTestResultsSchema = z.object({
  params: z.object({
    attemptId: z.string().min(1, 'Attempt ID is required'),
  }),
});

// Delete test schema
export const deleteTestSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Test ID is required'),
  }),
});

// Get user attempts schema
export const getUserAttemptsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    testId: z.string().optional(),
  }).optional(),
});
