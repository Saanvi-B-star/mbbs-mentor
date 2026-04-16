/**
 * LLM Controller
 * Handles HTTP requests for RAG chatbot
 */
import { Request, Response, NextFunction } from 'express';
import { llmService } from './llm.service';
import { HTTP_STATUS } from '@/shared/constants';
import { ChatRequest } from './llm.types';


/**
 * LLM Controller Class
 */
class LLMController {
  /**
   * Process a chat message
   * POST /api/v1/llm/chat
   *
   * @swagger
   * /api/v1/llm/chat:
   *   post:
   *     summary: Send a question to the AI tutor
   *     description: Processes a question using RAG - retrieves relevant study material and generates an educational response
   *     tags: [LLM]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - question
   *             properties:
   *               question:
   *                 type: string
   *                 description: The medical question to ask
   *                 example: "Explain the brachial plexus and its clinical significance"
   *     responses:
   *       200:
   *         description: Successful response from AI tutor
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     answer:
   *                       type: string
   *                       description: AI-generated educational response
   *                     tokensUsed:
   *                       type: number
   *                       nullable: true
   *                       description: Number of tokens used
   *                       example: 420
   *                     model:
   *                       type: string
   *                       description: Model used for generation
   *                       example: "gpt-4o-mini"
   *                     sources:
   *                       type: array
   *                       description: Retrieved study material sources
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           score:
   *                             type: number
   *                           metadata:
   *                             type: object
   *       400:
   *         description: Invalid request - question is required
   *       500:
   *         description: Server error
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question } = req.body as ChatRequest;
      const userId = req.user?.id;

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Question is required',
        });
        return;
      }

      const result = await llmService.chat({
        question: question.trim(),
        userId,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get chat history
   * GET /api/v1/llm/history
   *
   * @swagger
   * /api/v1/llm/history:
   *   get:
   *     summary: Get user's chat history
   *     description: Retrieves the chat history for the authenticated user
   *     tags: [LLM]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Maximum number of chats to return
   *     responses:
   *       200:
   *         description: Chat history retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       question:
   *                         type: string
   *                       response:
   *                         type: string
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *       401:
   *         description: Unauthorized
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const history = await llmService.getChatHistory(userId, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear chat history
   * DELETE /api/v1/llm/history
   *
   * @swagger
   * /api/v1/llm/history:
   *   delete:
   *     summary: Clear user's chat history
   *     description: Deletes all chat history for the authenticated user
   *     tags: [LLM]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Chat history cleared successfully
   *       401:
   *         description: Unauthorized
   */
  async clearHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      await llmService.clearChatHistory(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Chat history cleared',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const llmController = new LLMController();
