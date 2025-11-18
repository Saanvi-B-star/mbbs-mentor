import { Request, Response, NextFunction } from 'express';
import { topicService } from './topic.service';
import { HTTP_STATUS } from '@/shared/constants';
import { CreateTopicDto, UpdateTopicDto } from './topic.types';

/**
 * Topic Controller
 * Handles HTTP requests for topic operations
 */
export class TopicController {
  /**
   * Get all topics
   * GET /api/v1/topics
   */
  async getAllTopics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const subjectId = req.query.subjectId as string;

      const result = await topicService.getAllTopics({
        page,
        limit,
        subjectId,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.topics,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get topic by ID
   * GET /api/v1/topics/:id
   */
  async getTopicById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await topicService.getTopicById(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new topic
   * POST /api/v1/topics
   */
  async createTopic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateTopicDto = req.body;

      const result = await topicService.createTopic(data);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Topic created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update topic
   * PATCH /api/v1/topics/:id
   */
  async updateTopic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateTopicDto = req.body;

      const result = await topicService.updateTopic(id, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Topic updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete topic
   * DELETE /api/v1/topics/:id
   */
  async deleteTopic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await topicService.deleteTopic(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Topic deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get topics by subject
   * GET /api/v1/topics/subject/:subjectId
   */
  async getTopicsBySubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId } = req.params;

      const result = await topicService.getTopicsBySubject(subjectId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get topic hierarchy
   * GET /api/v1/topics/subject/:subjectId/hierarchy
   */
  async getTopicHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId } = req.params;

      const result = await topicService.getTopicHierarchy(subjectId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get topic with materials
   * GET /api/v1/topics/:id/materials
   */
  async getTopicMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await topicService.getTopicWithMaterials(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get topic statistics
   * GET /api/v1/topics/:id/stats
   */
  async getTopicStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await topicService.getTopicStats(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const topicController = new TopicController();
