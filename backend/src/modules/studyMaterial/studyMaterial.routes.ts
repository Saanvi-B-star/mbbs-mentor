import { Router } from 'express';
import { StudyMaterialController } from './studyMaterial.controller';

const router = Router();
const controller = new StudyMaterialController();

/**
 * @swagger
 * tags:
 *   name: Study Material
 *   description: Global MBBS study materials (admin uploaded)
 */

/**
 * @swagger
 * /api/v1/study-material:
 *   get:
 *     summary: Get all study materials
 *     tags: [Study Material]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of study materials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudyMaterial'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/', controller.getAllStudyMaterial);

/**
 * @swagger
 * /api/v1/study-material/{id}:
 *   get:
 *     summary: Get study material by ID
 *     tags: [Study Material]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Study material ID
 *     responses:
 *       200:
 *         description: Study material found
 *       404:
 *         description: Study material not found
 */
router.get('/:id', controller.getStudyMaterialById);

export default router;
