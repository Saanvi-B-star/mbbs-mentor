import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { validate, authMiddleware, requireAdmin } from '@/middleware';
import {
  getTestAnalyticsSchema,
  studyTimePeriodSchema,
  revenueStatsSchema,
} from './analytics.validation';

/**
 * Analytics Routes
 */
const router = Router();

/**
 * All routes require authentication
 */
router.use(authMiddleware);

/**
 * User Analytics Routes
 */

// Get user analytics
router.get('/user', analyticsController.getUserAnalytics.bind(analyticsController));

// Get test analytics
router.get(
  '/test/:attemptId',
  validate(getTestAnalyticsSchema),
  analyticsController.getTestAnalytics.bind(analyticsController)
);

// Get subject comparison
router.get(
  '/subject-comparison',
  analyticsController.getSubjectComparison.bind(analyticsController)
);

// Get topic mastery
router.get('/topic-mastery', analyticsController.getTopicMastery.bind(analyticsController));

// Get study time analytics
router.get(
  '/study-time',
  validate(studyTimePeriodSchema),
  analyticsController.getStudyTimeAnalytics.bind(analyticsController)
);

// Get recommendations
router.get('/recommendations', analyticsController.getRecommendations.bind(analyticsController));

/**
 * Admin Analytics Routes
 */

// Get platform analytics
router.get(
  '/platform',
  requireAdmin,
  analyticsController.getPlatformAnalytics.bind(analyticsController)
);

// Get revenue stats
router.get(
  '/revenue',
  requireAdmin,
  validate(revenueStatsSchema),
  analyticsController.getRevenueStats.bind(analyticsController)
);

export { router as analyticsRoutes };
