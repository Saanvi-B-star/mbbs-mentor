import { Request, Response, NextFunction } from 'express';
import { testService } from './test.service';
import { HTTP_STATUS } from '@/shared/constants';
import { GenerateTestCriteria, SubmitAnswerDto } from './test.types';

/**
 * Test Controller
 * Handles HTTP requests for test operations
 */
export class TestController {
  /**
   * Generate a new test
   * POST /api/v1/tests/generate
   */
  async generateTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const criteria: GenerateTestCriteria = req.body;

      const result = await testService.generateTest(userId, criteria);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Test generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's tests
   * GET /api/v1/tests
   */
  async getUserTests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await testService.getUserTests(userId, page, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.tests,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test by ID
   * GET /api/v1/tests/:id
   */
  async getTestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const result = await testService.getTestById(id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start a test attempt
   * POST /api/v1/tests/:id/start
   */
  async startTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const result = await testService.startTest(userId, id);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Test started successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit an answer
   * POST /api/v1/tests/attempts/:attemptId/answer
   */
  async submitAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { attemptId } = req.params;
      const answerData: Omit<SubmitAnswerDto, 'testAttemptId'> = req.body;

      await testService.submitAnswer(userId, attemptId, answerData);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Answer submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit test
   * POST /api/v1/tests/attempts/:attemptId/submit
   */
  async submitTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { attemptId } = req.params;

      const result = await testService.submitTest(userId, attemptId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Test submitted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test results
   * GET /api/v1/tests/attempts/:attemptId/results
   */
  async getTestResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { attemptId } = req.params;

      const result = await testService.getTestResults(userId, attemptId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's test attempts
   * GET /api/v1/tests/attempts
   */
  async getUserAttempts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const testId = req.query.testId as string | undefined;

      const result = await testService.getUserAttempts(userId, page, limit, testId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.attempts,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete test
   * DELETE /api/v1/tests/:id
   */
  async deleteTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      await testService.deleteTest(id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Test deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test analytics
   * GET /api/v1/tests/attempts/:attemptId/analytics
   */
  async getTestAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { attemptId } = req.params;

      const result = await testService.getTestAnalytics(attemptId, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const testController = new TestController();
