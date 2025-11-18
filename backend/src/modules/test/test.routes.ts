import { Router } from 'express';
import { testController } from './test.controller';
import { validate, authMiddleware } from '@/middleware';
import {
  generateTestSchema,
  getTestByIdSchema,
  startTestSchema,
  submitAnswerSchema,
  submitTestSchema,
  getTestResultsSchema,
  deleteTestSchema,
  getUserAttemptsSchema,
} from './test.validation';

/**
 * Test Routes
 * All routes require authentication
 */
const router = Router();

/**
 * Test management routes
 */

// Generate a new test (requires auth and token check)
router.post(
  '/generate',
  authMiddleware,
  validate(generateTestSchema),
  testController.generateTest.bind(testController)
);

// Get user's tests (requires auth)
router.get('/', authMiddleware, testController.getUserTests.bind(testController));

// Get test by ID (requires auth)
router.get(
  '/:id',
  authMiddleware,
  validate(getTestByIdSchema),
  testController.getTestById.bind(testController)
);

// Start a test attempt (requires auth)
router.post(
  '/:id/start',
  authMiddleware,
  validate(startTestSchema),
  testController.startTest.bind(testController)
);

// Delete test (requires auth)
router.delete(
  '/:id',
  authMiddleware,
  validate(deleteTestSchema),
  testController.deleteTest.bind(testController)
);

/**
 * Test attempt routes
 */

// Submit an answer (requires auth)
router.post(
  '/attempts/:attemptId/answer',
  authMiddleware,
  validate(submitAnswerSchema),
  testController.submitAnswer.bind(testController)
);

// Submit test (requires auth)
router.post(
  '/attempts/:attemptId/submit',
  authMiddleware,
  validate(submitTestSchema),
  testController.submitTest.bind(testController)
);

// Get test results (requires auth)
router.get(
  '/attempts/:attemptId/results',
  authMiddleware,
  validate(getTestResultsSchema),
  testController.getTestResults.bind(testController)
);

// Get test analytics (requires auth)
router.get(
  '/attempts/:attemptId/analytics',
  authMiddleware,
  validate(getTestResultsSchema),
  testController.getTestAnalytics.bind(testController)
);

// Get user's test attempts (requires auth)
router.get(
  '/attempts',
  authMiddleware,
  validate(getUserAttemptsSchema),
  testController.getUserAttempts.bind(testController)
);

export { router as testRoutes };
