import { Request, Response, NextFunction } from 'express';
import { questionService } from './question.service';
import { HTTP_STATUS } from '@/shared/constants';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionFilters,
  RandomQuestionFilters,
  BulkImportQuestionDto,
  CreateQuestionOptionDto,
  UpdateQuestionOptionDto,
} from './question.types';
import { QuestionType, DifficultyLevel } from '@prisma/client';

/**
 * Question Controller
 * Handles HTTP requests for question operations
 */
export class QuestionController {
  /**
   * Get all questions
   * GET /api/v1/questions
   */
  async getAllQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: QuestionFilters = {
        topicId: req.query.topicId as string,
        questionType: req.query.questionType as QuestionType,
        difficultyLevel: req.query.difficultyLevel as DifficultyLevel,
        isActive: req.query.isActive === 'true',
        isApproved: req.query.isApproved === 'true',
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      };

      const result = await questionService.getAllQuestions(filters, page, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.questions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get question by ID
   * GET /api/v1/questions/:id
   */
  async getQuestionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const includeOptions = req.query.includeOptions !== 'false';

      const result = await questionService.getQuestionById(id, includeOptions);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new question
   * POST /api/v1/questions
   */
  async createQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateQuestionDto = req.body;
      const userId = (req.user as any)?.id;

      const result = await questionService.createQuestion(data, userId);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Question created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update question
   * PATCH /api/v1/questions/:id
   */
  async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: UpdateQuestionDto = req.body;

      const result = await questionService.updateQuestion(id, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Question updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete question
   * DELETE /api/v1/questions/:id
   */
  async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      await questionService.deleteQuestion(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Question deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve question
   * POST /api/v1/questions/:id/approve
   */
  async approveQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const result = await questionService.approveQuestion(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Question approved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get random questions
   * POST /api/v1/questions/random
   */
  async getRandomQuestions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters: RandomQuestionFilters = req.body;

      const result = await questionService.getRandomQuestions(filters);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        count: result.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk import questions
   * POST /api/v1/questions/bulk-import
   */
  async bulkImportQuestions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: BulkImportQuestionDto = req.body;
      const userId = (req.user as any)?.id;

      const result = await questionService.bulkImportQuestions(data, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Successfully imported ${result.imported} questions. ${result.failed} failed.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create question option
   * POST /api/v1/questions/:questionId/options
   */
  async createOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionId = req.params.questionId as string;
      const data: CreateQuestionOptionDto = req.body;

      const result = await questionService.createOption(questionId, data);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Question option created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update question option
   * PATCH /api/v1/questions/options/:optionId
   */
  async updateOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const optionId = req.params.optionId as string;
      const data: UpdateQuestionOptionDto = req.body;

      const result = await questionService.updateOption(optionId, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Question option updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete question option
   * DELETE /api/v1/questions/options/:optionId
   */
  async deleteOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const optionId = req.params.optionId as string;

      await questionService.deleteOption(optionId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Question option deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const questionController = new QuestionController();
