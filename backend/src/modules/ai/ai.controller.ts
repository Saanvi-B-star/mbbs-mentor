import { Request, Response, NextFunction } from 'express';
import { aiService } from './ai.service';
import { HTTP_STATUS } from '@/shared/constants';
import {
  AIChatDto,
  GenerateNotesDto,
  GenerateSummaryDto,
  GenerateFlashcardsDto,
  ConversationQuery,
} from './ai.types';

/**
 * AI Controller
 * Handles HTTP requests for AI operations
 */
export class AIController {
  /**
   * Chat with AI
   * POST /api/v1/ai/chat
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: AIChatDto = req.body;

      const result = await aiService.chat(userId, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate notes
   * POST /api/v1/ai/generate-notes
   */
  async generateNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: GenerateNotesDto = req.body;

      const result = await aiService.generateNotes(userId, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notes generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate summary
   * POST /api/v1/ai/generate-summary
   */
  async generateSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: GenerateSummaryDto = req.body;

      const result = await aiService.generateSummary(userId, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Summary generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate flashcards
   * POST /api/v1/ai/generate-flashcards
   */
  async generateFlashcards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: GenerateFlashcardsDto = req.body;

      const result = await aiService.generateFlashcards(userId, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Flashcards generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conversations
   * GET /api/v1/ai/conversations
   */
  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: ConversationQuery = req.query as any;

      const result = await aiService.getConversations(userId, query);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.conversations,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conversation by ID
   * GET /api/v1/ai/conversations/:conversationId
   */
  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;

      const result = await aiService.getConversation(userId, conversationId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete conversation
   * DELETE /api/v1/ai/conversations/:conversationId
   */
  async deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;

      await aiService.deleteConversation(userId, conversationId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Conversation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
