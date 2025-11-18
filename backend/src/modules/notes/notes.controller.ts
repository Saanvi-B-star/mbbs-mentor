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
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'No file uploaded',
        });
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
      const { id } = req.params;

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
      const { id } = req.params;
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
      const { id } = req.params;

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
      const { id } = req.params;
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
}

export const notesController = new NotesController();
