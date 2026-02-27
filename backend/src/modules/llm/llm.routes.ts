/**
 * LLM Routes
 * Express router for RAG chatbot endpoints
 */

import { Router } from 'express';
import { llmController } from './llm.controller';
import { validate, authMiddleware, optionalAuthMiddleware } from '@/middleware';
import { chatSchema, getHistorySchema } from './llm.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: LLM
 *   description: AI-powered RAG chatbot for MBBS learning
 */

/**
 * Public routes (optional auth)
 */

/**
 * @swagger
 * /api/v1/llm/chat:
 *   post:
 *     summary: Chat with the AI tutor using RAG (Retrieval-Augmented Generation)
 *     description: |
 *       Send a question to the AI tutor and get a contextual answer based on medical knowledge. 
 *       Authentication is optional - anonymous users can chat but history won't be saved with userId.
 *       Uses Pinecone vector database for semantic search and OpenAI for response generation.
 *     tags: [AI]
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
 *                 minLength: 3
 *                 maxLength: 2000
 *                 description: Your question for the AI tutor
 *                 example: "Explain the cardiac cycle and its phases"
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Chat response generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                       example: "The cardiac cycle consists of two main phases..."
 *                     sources:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           content:
 *                             type: string
 *                           metadata:
 *                             type: object
 *                     conversationId:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (if auth is required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/chat',
  optionalAuthMiddleware,
  validate(chatSchema),
  llmController.chat.bind(llmController)
);

/**
 * Protected routes (require auth)
 */

/**
 * @swagger
 * /api/v1/llm/history:
 *   get:
 *     summary: Get chat history for the authenticated user
 *     description: Retrieve previous chat conversations with the AI tutor. Returns a paginated list of conversations.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of conversations to retrieve (max 100)
 *         example: 20
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
 *                 message:
 *                   type: string
 *                   example: "Chat history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           question:
 *                             type: string
 *                           response:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                       example: 45
 *       401:
 *         description: Unauthorized - valid JWT required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/history',
  authMiddleware,
  validate(getHistorySchema),
  llmController.getHistory.bind(llmController)
);

/**
 * @swagger
 * /api/v1/llm/history:
 *   delete:
 *     summary: Clear all chat history for the authenticated user
 *     description: Permanently delete all previous chat conversations. This action cannot be undone.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat history cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Chat history cleared successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       example: 15
 *       401:
 *         description: Unauthorized - valid JWT required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/history',
  authMiddleware,
  llmController.clearHistory.bind(llmController)
);

export { router as llmRoutes };
