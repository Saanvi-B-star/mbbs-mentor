import { Request, Response, NextFunction } from 'express';
import { subjectService } from './subject.service';
import { HTTP_STATUS } from '@/shared/constants';
import { CreateSubjectDto, UpdateSubjectDto } from './subject.types';

/**
 * Subject Controller
 * Handles HTTP requests for subject operations
 */
export class SubjectController {
  /**
   * Get all subjects
   * GET /api/v1/subjects
   */
  async getAllSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const mbbsYear = req.query.mbbsYear ? parseInt(req.query.mbbsYear as string) : undefined;

      const result = await subjectService.getAllSubjects({
        page,
        limit,
        mbbsYear,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.subjects,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get subject by ID
   * GET /api/v1/subjects/:id
   */
  async getSubjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const result = await subjectService.getSubjectById(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new subject
   * POST /api/v1/subjects
   */
  async createSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateSubjectDto = req.body;

      const result = await subjectService.createSubject(data);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Subject created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update subject
   * PATCH /api/v1/subjects/:id
   */
  async updateSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const data: UpdateSubjectDto = req.body;

      const result = await subjectService.updateSubject(id, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Subject updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete subject
   * DELETE /api/v1/subjects/:id
   */
  async deleteSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      await subjectService.deleteSubject(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Subject deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get subject with topics
   * GET /api/v1/subjects/:id/topics
   */
  async getSubjectTopics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const result = await subjectService.getSubjectWithTopics(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get subject statistics
   * GET /api/v1/subjects/:id/stats
   */
  async getSubjectStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const result = await subjectService.getSubjectStats(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const subjectController = new SubjectController();
