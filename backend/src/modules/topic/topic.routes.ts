import { Router } from 'express';
import { topicController } from './topic.controller';
import { validate, authMiddleware, requireAdmin } from '@/middleware';
import {
  createTopicSchema,
  updateTopicSchema,
  getTopicByIdSchema,
  deleteTopicSchema,
  getTopicsBySubjectSchema,
  getTopicMaterialsSchema,
} from './topic.validation';

/**
 * Topic Routes
 */
const router = Router();

/**
 * Public routes
 */

// Get all topics (public)
router.get('/', topicController.getAllTopics.bind(topicController));

// Get topic by ID (public)
router.get(
  '/:id',
  validate(getTopicByIdSchema),
  topicController.getTopicById.bind(topicController)
);

// Get topics by subject (public)
router.get(
  '/subject/:subjectId',
  validate(getTopicsBySubjectSchema),
  topicController.getTopicsBySubject.bind(topicController)
);

// Get topic hierarchy by subject (public)
router.get(
  '/subject/:subjectId/hierarchy',
  validate(getTopicsBySubjectSchema),
  topicController.getTopicHierarchy.bind(topicController)
);

// Get topic materials (public)
router.get(
  '/:id/materials',
  validate(getTopicMaterialsSchema),
  topicController.getTopicMaterials.bind(topicController)
);

// Get topic statistics (public)
router.get(
  '/:id/stats',
  validate(getTopicByIdSchema),
  topicController.getTopicStats.bind(topicController)
);

/**
 * Admin-only routes
 */

// Create new topic (admin only)
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  validate(createTopicSchema),
  topicController.createTopic.bind(topicController)
);

// Update topic (admin only)
router.patch(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(updateTopicSchema),
  topicController.updateTopic.bind(topicController)
);

// Delete topic (admin only)
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(deleteTopicSchema),
  topicController.deleteTopic.bind(topicController)
);

export { router as topicRoutes };
