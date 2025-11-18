import { Router } from 'express';
import { subjectController } from './subject.controller';
import { validate, authMiddleware, requireAdmin } from '@/middleware';
import {
  createSubjectSchema,
  updateSubjectSchema,
  getSubjectByIdSchema,
  deleteSubjectSchema,
  getSubjectTopicsSchema,
} from './subject.validation';

/**
 * Subject Routes
 */
const router = Router();

/**
 * Public routes
 */

// Get all subjects (public)
router.get('/', subjectController.getAllSubjects.bind(subjectController));

// Get subject by ID (public)
router.get(
  '/:id',
  validate(getSubjectByIdSchema),
  subjectController.getSubjectById.bind(subjectController)
);

// Get subject topics (public)
router.get(
  '/:id/topics',
  validate(getSubjectTopicsSchema),
  subjectController.getSubjectTopics.bind(subjectController)
);

// Get subject statistics (public)
router.get(
  '/:id/stats',
  validate(getSubjectByIdSchema),
  subjectController.getSubjectStats.bind(subjectController)
);

/**
 * Admin-only routes
 */

// Create new subject (admin only)
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  validate(createSubjectSchema),
  subjectController.createSubject.bind(subjectController)
);

// Update subject (admin only)
router.patch(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(updateSubjectSchema),
  subjectController.updateSubject.bind(subjectController)
);

// Delete subject (admin only)
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(deleteSubjectSchema),
  subjectController.deleteSubject.bind(subjectController)
);

export { router as subjectRoutes };
