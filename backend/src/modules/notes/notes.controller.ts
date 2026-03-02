import { Request, Response, NextFunction } from 'express';
import { notesService } from './notes.service';
import { HTTP_STATUS } from '@/shared/constants';
import { UploadNoteDto, UpdateNoteDto, GenerateFlashcardsDto } from './notes.types';

/**
 * Notes Controller
 */
export class NotesController {
  /**
   * Upload note
   * POST /api/v1/notes/upload
   */
  async uploadNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const file = req.file;
      const { title, tags }: UploadNoteDto = req.body;

      if (!file) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      const result = await notesService.uploadNote(userId, file, title, tags);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Note uploaded successfully. Processing will complete shortly.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's notes
   * GET /api/v1/notes
   */
  async getUserNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as any;

      const result = await notesService.getUserNotes(userId, page, limit, status);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get note by ID
   * GET /api/v1/notes/:id
   */
  async getNoteById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };

      const result = await notesService.getNoteById(id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update note
   * PATCH /api/v1/notes/:id
   */
  async updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      const data: UpdateNoteDto = req.body;

      const result = await notesService.updateNote(id, userId, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Note updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete note
   * DELETE /api/v1/notes/:id
   */
  async deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };

      await notesService.deleteNote(id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Note deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate flashcards from note
   * POST /api/v1/notes/:id/flashcards
   */
  async generateFlashcards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      const { count }: GenerateFlashcardsDto = req.body;

      const result = await notesService.generateFlashcards(id, userId, count);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search notes
   * GET /api/v1/notes/extract/search
   */
  async searchNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = {
        searchTerm: req.query.searchTerm as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        status: req.query.status as any,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as any) || 'desc',
      };

      const result = await notesService.searchNotes(userId, query);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notes search completed',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract notes by tags
   * POST /api/v1/notes/extract/by-tags
   */
  async extractByTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { tags, page = 1, limit = 10 } = req.body;

      const result = await notesService.extractByTags(userId, { tags, page, limit });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notes extracted by tags',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract notes by date range
   * POST /api/v1/notes/extract/by-date
   */
  async extractByDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, page = 1, limit = 10 } = req.body;

      const result = await notesService.extractByDateRange(userId, { startDate, endDate, page, limit });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notes extracted by date range',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract notes by status
   * GET /api/v1/notes/extract/by-status/:status
   */
  async extractByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await notesService.extractByStatus(userId, status as any, page, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Notes extracted with status: ${status}`,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get processed notes
   * GET /api/v1/notes/extract/processed
   */
  async getProcessedNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await notesService.getProcessedNotes(userId, page, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Processed notes retrieved',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get note statistics
   * GET /api/v1/notes/statistics
   */
  async getNoteStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await notesService.getNoteStatistics(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Note statistics retrieved',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export notes
   * GET /api/v1/notes/export
   */
  async exportNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const format = (req.query.format as 'json' | 'csv') || 'json';
      const filters = {
        status: req.query.status as any,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const result = await notesService.exportNotes(userId, format, filters);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.csv);
      } else {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          message: 'Notes exported successfully',
          data: result,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract notes by topic
   * GET /api/v1/notes/by-topic/:topicId
   */
  async extractByTopic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { topicId } = req.params as { topicId: string };
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await notesService.extractByTopic(userId, topicId, page, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notes extracted by topic',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract notes by subject
   * GET /api/v1/notes/by-subject/:subjectId
   */
  async extractBySubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId } = req.params as { subjectId: string };
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await notesService.extractBySubject(userId, subjectId, page, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notes extracted by subject',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notes organized by topics within a subject
   * GET /api/v1/notes/tree/subject/:subjectId
   */
  async getNotesBySubjectTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subjectId } = req.params as { subjectId: string };

      const result = await notesService.getNotesBySubjectTree(userId, subjectId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notes organized by topics',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notes organized by subjects and topics (full hierarchy)
   * GET /api/v1/notes/tree/all
   */
  async getNotesBySubjectsTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await notesService.getNotesBySubjectsTree(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notes organized by subjects and topics',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notesController = new NotesController();
