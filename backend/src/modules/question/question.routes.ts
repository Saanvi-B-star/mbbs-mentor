import { Router } from 'express';
import { questionController } from './question.controller';
import { validate, authMiddleware, requireAdmin } from '@/middleware';
import {
  createQuestionSchema,
  updateQuestionSchema,
  getQuestionByIdSchema,
  deleteQuestionSchema,
  approveQuestionSchema,
  getRandomQuestionsSchema,
  bulkImportQuestionsSchema,
  createQuestionOptionValidationSchema,
  updateQuestionOptionSchema,
  deleteQuestionOptionSchema,
} from './question.validation';

/**
 * Question Routes
 */
const router = Router();

/**
 * Public/Protected routes
 */

// Get all questions (public with filters)
router.get('/', questionController.getAllQuestions.bind(questionController));

// Get question by ID (public)
router.get(
  '/:id',
  validate(getQuestionByIdSchema),
  questionController.getQuestionById.bind(questionController)
);

// Get random questions (public/authenticated)
router.post(
  '/random',
  validate(getRandomQuestionsSchema),
  questionController.getRandomQuestions.bind(questionController)
);

/**
 * Admin-only routes
 */

// Create new question (admin only)
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  validate(createQuestionSchema),
  questionController.createQuestion.bind(questionController)
);

// Update question (admin only)
router.patch(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(updateQuestionSchema),
  questionController.updateQuestion.bind(questionController)
);

// Delete question (admin only)
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(deleteQuestionSchema),
  questionController.deleteQuestion.bind(questionController)
);

// Approve question (admin only)
router.post(
  '/:id/approve',
  authMiddleware,
  requireAdmin,
  validate(approveQuestionSchema),
  questionController.approveQuestion.bind(questionController)
);

// Bulk import questions (admin only)
router.post(
  '/bulk-import',
  authMiddleware,
  requireAdmin,
  validate(bulkImportQuestionsSchema),
  questionController.bulkImportQuestions.bind(questionController)
);

/**
 * Question options routes (admin only)
 */

// Create question option
router.post(
  '/:questionId/options',
  authMiddleware,
  requireAdmin,
  validate(createQuestionOptionValidationSchema),
  questionController.createOption.bind(questionController)
);

// Update question option
router.patch(
  '/options/:optionId',
  authMiddleware,
  requireAdmin,
  validate(updateQuestionOptionSchema),
  questionController.updateOption.bind(questionController)
);

// Delete question option
router.delete(
  '/options/:optionId',
  authMiddleware,
  requireAdmin,
  validate(deleteQuestionOptionSchema),
  questionController.deleteOption.bind(questionController)
);

export { router as questionRoutes };
