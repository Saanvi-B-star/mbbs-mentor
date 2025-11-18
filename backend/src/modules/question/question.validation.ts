import { z } from 'zod';
import { QuestionType, DifficultyLevel } from '@prisma/client';

/**
 * Question Validation Schemas
 * Zod schemas for validating question-related inputs
 */

// Question option schema
const createQuestionOptionSchema = z.object({
  optionText: z.string().min(1, 'Option text is required'),
  optionImageUrl: z.string().url().optional(),
  isCorrect: z.boolean(),
  explanation: z.string().optional(),
  sortOrder: z.number().int().min(0),
});

// Create question schema
export const createQuestionSchema = z.object({
  body: z
    .object({
      topicId: z.string().optional(),
      questionType: z.nativeEnum(QuestionType, {
        errorMap: () => ({ message: 'Invalid question type' }),
      }),
      questionText: z.string().min(1, 'Question text is required'),
      questionImageUrl: z.string().url().optional(),
      explanation: z.string().optional(),
      difficultyLevel: z.nativeEnum(DifficultyLevel, {
        errorMap: () => ({ message: 'Invalid difficulty level' }),
      }),
      tags: z.array(z.string()).optional().default([]),
      source: z.string().optional(),
      options: z.array(createQuestionOptionSchema).optional(),
    })
    .refine(
      (data) => {
        // MCQ and TRUE_FALSE questions must have options
        if (data.questionType === QuestionType.MCQ || data.questionType === QuestionType.TRUE_FALSE) {
          return data.options && data.options.length > 0;
        }
        return true;
      },
      {
        message: 'MCQ and TRUE_FALSE questions must have options',
        path: ['options'],
      }
    )
    .refine(
      (data) => {
        // MCQ must have 2-6 options
        if (data.questionType === QuestionType.MCQ && data.options) {
          return data.options.length >= 2 && data.options.length <= 6;
        }
        return true;
      },
      {
        message: 'MCQ must have between 2 and 6 options',
        path: ['options'],
      }
    )
    .refine(
      (data) => {
        // TRUE_FALSE must have exactly 2 options
        if (data.questionType === QuestionType.TRUE_FALSE && data.options) {
          return data.options.length === 2;
        }
        return true;
      },
      {
        message: 'TRUE_FALSE questions must have exactly 2 options',
        path: ['options'],
      }
    )
    .refine(
      (data) => {
        // Must have at least one correct option
        if (data.options) {
          return data.options.some((opt) => opt.isCorrect);
        }
        return true;
      },
      {
        message: 'At least one option must be marked as correct',
        path: ['options'],
      }
    ),
});

// Update question schema
export const updateQuestionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Question ID is required'),
  }),
  body: z
    .object({
      topicId: z.string().optional(),
      questionType: z.nativeEnum(QuestionType).optional(),
      questionText: z.string().min(1).optional(),
      questionImageUrl: z.string().url().optional(),
      explanation: z.string().optional(),
      difficultyLevel: z.nativeEnum(DifficultyLevel).optional(),
      tags: z.array(z.string()).optional(),
      source: z.string().optional(),
      options: z.array(createQuestionOptionSchema).optional(),
    })
    .partial(),
});

// Get question by ID schema
export const getQuestionByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Question ID is required'),
  }),
  query: z.object({
    includeOptions: z.enum(['true', 'false']).optional(),
  }).optional(),
});

// Delete question schema
export const deleteQuestionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Question ID is required'),
  }),
});

// Approve question schema
export const approveQuestionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Question ID is required'),
  }),
});

// Get random questions schema
export const getRandomQuestionsSchema = z.object({
  body: z.object({
    topicIds: z.array(z.string()).optional(),
    subjectIds: z.array(z.string()).optional(),
    difficultyLevel: z.nativeEnum(DifficultyLevel).optional(),
    questionTypes: z.array(z.nativeEnum(QuestionType)).optional(),
    count: z.number().int().min(1).max(100).default(10),
  }),
});

// Bulk import questions schema
export const bulkImportQuestionsSchema = z.object({
  body: z.object({
    questions: z.array(
      z.object({
        topicId: z.string().optional(),
        questionType: z.nativeEnum(QuestionType),
        questionText: z.string().min(1),
        questionImageUrl: z.string().url().optional(),
        explanation: z.string().optional(),
        difficultyLevel: z.nativeEnum(DifficultyLevel),
        tags: z.array(z.string()).optional().default([]),
        source: z.string().optional(),
        options: z.array(createQuestionOptionSchema).optional(),
      })
    ),
  }),
});

// Create question option schema
export const createQuestionOptionValidationSchema = z.object({
  params: z.object({
    questionId: z.string().min(1, 'Question ID is required'),
  }),
  body: createQuestionOptionSchema,
});

// Update question option schema
export const updateQuestionOptionSchema = z.object({
  params: z.object({
    optionId: z.string().min(1, 'Option ID is required'),
  }),
  body: z
    .object({
      optionText: z.string().min(1).optional(),
      optionImageUrl: z.string().url().optional(),
      isCorrect: z.boolean().optional(),
      explanation: z.string().optional(),
      sortOrder: z.number().int().min(0).optional(),
    })
    .partial(),
});

// Delete question option schema
export const deleteQuestionOptionSchema = z.object({
  params: z.object({
    optionId: z.string().min(1, 'Option ID is required'),
  }),
});
