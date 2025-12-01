import { Router } from 'express';
import { studentGoalsController } from './studentGoals.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { 
  createStudentGoalsSchema, 
  updateStudentGoalsSchema,
  addGoalSchema,
  removeGoalSchema
} from './studentGoals.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Student Goals
 *   description: Student onboarding and learning goals management
 */

/**
 * @swagger
 * /api/v1/student-goals/available:
 *   get:
 *     summary: Get all available goal options
 *     tags: [Student Goals]
 *     description: Fetch all predefined learning goal options.
 *     responses:
 *       200:
 *         description: List of available goals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                   key:
 *                     type: string
 *                     example: exam_preparation
 *                   title:
 *                     type: string
 *                     example: Exam Preparation
 */
router.get(
  '/available',
  studentGoalsController.getAvailableGoals.bind(studentGoalsController)
);

/**
 * All routes below require authentication
 */
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/student-goals:
 *   post:
 *     summary: Create student goals
 *     tags: [Student Goals]
 *     security:
 *       - bearerAuth: []
 *     description: Save selected goals for the logged-in student.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["exam_preparation", "clinical_skills"]
 *     responses:
 *       201:
 *         description: Goals created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  validateBody(createStudentGoalsSchema),
  studentGoalsController.createStudentGoals.bind(studentGoalsController)
);

/**
 * @swagger
 * /api/v1/student-goals:
 *   get:
 *     summary: Get current user's student goals
 *     tags: [Student Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User’s selected goals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   key:
 *                     type: string
 *                   title:
 *                     type: string
 */
router.get(
  '/',
  studentGoalsController.getStudentGoals.bind(studentGoalsController)
);

/**
 * @swagger
 * /api/v1/student-goals:
 *   put:
 *     summary: Update student goals
 *     tags: [Student Goals]
 *     security:
 *       - bearerAuth: []
 *     description: Replace existing student goals with new ones.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["quick_revision", "internship_readiness"]
 *     responses:
 *       200:
 *         description: Goals updated successfully
 */
router.put(
  '/',
  validateBody(updateStudentGoalsSchema),
  studentGoalsController.updateStudentGoals.bind(studentGoalsController)
);

/**
 * @swagger
 * /api/v1/student-goals:
 *   delete:
 *     summary: Delete all student goals
 *     tags: [Student Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student goals deleted successfully
 */
router.delete(
  '/',
  studentGoalsController.deleteStudentGoals.bind(studentGoalsController)
);

/**
 * @swagger
 * /api/v1/student-goals/add:
 *   post:
 *     summary: Add a single goal
 *     tags: [Student Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goal:
 *                 type: string
 *                 example: case_based_learning
 *     responses:
 *       200:
 *         description: Goal added successfully
 */
router.post(
  '/add',
  validateBody(addGoalSchema),
  studentGoalsController.addGoal.bind(studentGoalsController)
);

/**
 * @swagger
 * /api/v1/student-goals/remove:
 *   post:
 *     summary: Remove a single goal
 *     tags: [Student Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goal:
 *                 type: string
 *                 example: clinical_skills
 *     responses:
 *       200:
 *         description: Goal removed successfully
 */
router.post(
  '/remove',
  validateBody(removeGoalSchema),
  studentGoalsController.removeGoal.bind(studentGoalsController)
);

/**
 * @swagger
 * /api/v1/student-goals/check/{goalType}:
 *   get:
 *     summary: Check if user has a specific goal
 *     tags: [Student Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goalType
 *         required: true
 *         schema:
 *           type: string
 *         example: exam_preparation
 *     responses:
 *       200:
 *         description: Goal check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasGoal:
 *                   type: boolean
 */
router.get(
  '/check/:goalType',
  studentGoalsController.checkGoal.bind(studentGoalsController)
);

export default router;
