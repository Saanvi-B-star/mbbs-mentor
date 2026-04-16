/**
 * RAG Routes
 * Express router for the PageIndex Vectorless RAG module
 */

import { Router } from 'express';
import { ragController } from './rag.controller';
import { validate, authMiddleware } from '@/middleware';
import { queryRagSchema } from './rag.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: RAG
 *   description: PageIndex Vectorless RAG — AI answers from indexed study content
 */

/**
 * @swagger
 * /api/v1/rag/query:
 *   post:
 *     summary: Query the RAG knowledge index
 *     description: |
 *       Sends a student question to the PageIndex Vectorless RAG system.
 *       The system loads the hierarchical content tree, selects the most
 *       relevant nodes using LLM reasoning, retrieves their full content,
 *       and generates a medical answer. Build the index first via POST /rag/build-index.
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 1000
 *                 description: The student's medical question
 *                 example: "Explain the cardiac cycle and its phases"
 *               conversationId:
 *                 type: string
 *                 description: Optional conversation ID for context tracking
 *     responses:
 *       200:
 *         description: RAG answer generated successfully
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
 *                       example: "The cardiac cycle consists of systole and diastole..."
 *                     sourcedNodes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nodeId:
 *                             type: string
 *                           title:
 *                             type: string
 *                           nodeType:
 *                             type: string
 *                     tokensUsed:
 *                       type: integer
 *                       nullable: true
 *                       example: 840
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
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
router.post('/query', authMiddleware, validate(queryRagSchema), ragController.query.bind(ragController));

/**
 * @swagger
 * /api/v1/rag/build-index:
 *   post:
 *     summary: Build or rebuild the RAG knowledge index (Admin only)
 *     description: |
 *       Reads all active Subjects, Topics, StudyMaterials, and Questions from the
 *       database, generates LLM summaries for each node in batches, and upserts
 *       them into the rag_index table. This can take several minutes for large
 *       content libraries. Requires ADMIN or SUPER_ADMIN role.
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Index built successfully
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
 *                     nodesIndexed:
 *                       type: integer
 *                       example: 312
 *                     timeTakenMs:
 *                       type: integer
 *                       example: 45230
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — ADMIN or SUPER_ADMIN role required
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
router.post('/build-index', authMiddleware, ragController.buildIndex.bind(ragController));

/**
 * @swagger
 * /api/v1/rag/stats:
 *   get:
 *     summary: Get RAG index statistics
 *     description: Returns the total number of indexed nodes, a breakdown by node type (subject, topic, material, question), and the timestamp of the last update.
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
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
 *                     totalNodes:
 *                       type: integer
 *                       example: 312
 *                     byType:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example:
 *                         subject: 12
 *                         topic: 85
 *                         material: 160
 *                         question: 55
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Unauthorized
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
router.get('/stats', authMiddleware, ragController.getStats.bind(ragController));

export { router as ragRoutes };
