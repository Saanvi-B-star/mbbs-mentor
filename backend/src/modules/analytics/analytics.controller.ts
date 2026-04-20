import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { HTTP_STATUS } from '@/shared/constants';

/**
 * Analytics Controller
 * Handles HTTP requests for analytics
 */
export class AnalyticsController {
  /**
   * Get user analytics
   * GET /api/v1/analytics/user
   */
  async getUserAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;

      const result = await analyticsService.getUserAnalytics(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test analytics
   * GET /api/v1/analytics/test/:attemptId
   */
  async getTestAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;
      const attemptId = req.params.attemptId as string;

      const result = await analyticsService.getTestAnalytics(userId, attemptId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get subject comparison
   * GET /api/v1/analytics/subject-comparison
   */
  async getSubjectComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;

      const result = await analyticsService.getSubjectComparison(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get topic mastery
   * GET /api/v1/analytics/topic-mastery
   */
  async getTopicMastery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;

      const result = await analyticsService.getTopicMastery(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get study time analytics
   * GET /api/v1/analytics/study-time
   */
  async getStudyTimeAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;
      const period = (req.query.period as string) || '30d';

      const result = await analyticsService.getStudyTimeAnalytics(userId, period);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get platform analytics (Admin only)
   * GET /api/v1/analytics/platform
   */
  async getPlatformAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await analyticsService.getPlatformAnalytics();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get revenue stats (Admin only)
   * GET /api/v1/analytics/revenue
   */
  async getRevenueStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dateRange = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const result = await analyticsService.getRevenueStats(dateRange);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recommendations
   * GET /api/v1/analytics/recommendations
   */
  async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;

      const result = await analyticsService.generateRecommendations(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
