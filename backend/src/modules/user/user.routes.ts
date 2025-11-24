import { Router } from 'express';
import { userController } from './user.controller';
import { validate, authMiddleware } from '@/middleware';
import { updateUserSchema, getUserByIdSchema, deleteAccountSchema } from './user.validation';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and account management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User unique identifier (CUID)
 *           example: clxxx123456789
 *         email:
 *           type: string
 *           format: email
 *           example: student@example.com
 *         name:
 *           type: string
 *           example: John Doe
 *         profilePicture:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://example.com/profile.jpg
 *         mbbsYear:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 2
 *         college:
 *           type: string
 *           nullable: true
 *           example: Medical College
 *         university:
 *           type: string
 *           nullable: true
 *           example: State University
 *         batchYear:
 *           type: integer
 *           example: 2023
 *         phoneNumber:
 *           type: string
 *           nullable: true
 *           example: +919876543210
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         gender:
 *           type: string
 *           enum: [male, female, other, prefer_not_to_say]
 *           nullable: true
 *         role:
 *           type: string
 *           enum: [STUDENT, ADMIN]
 *           example: STUDENT
 *         isActive:
 *           type: boolean
 *           example: true
 *         emailVerified:
 *           type: boolean
 *           example: true
 *         tokenBalance:
 *           type: integer
 *           example: 1000
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     UpdateUserDto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           example: John Doe
 *         profilePicture:
 *           type: string
 *           format: uri
 *           example: https://example.com/new-profile.jpg
 *         mbbsYear:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 3
 *         college:
 *           type: string
 *           example: ABC Medical College
 *         university:
 *           type: string
 *           example: XYZ University
 *         batchYear:
 *           type: integer
 *           minimum: 1990
 *           example: 2023
 *         phoneNumber:
 *           type: string
 *           pattern: '^\+?[1-9]\d{9,14}$'
 *           example: +919876543210
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *           example: 2000-01-15T00:00:00Z
 *         gender:
 *           type: string
 *           enum: [male, female, other, prefer_not_to_say]
 *           example: male
 *     
 *     UserStats:
 *       type: object
 *       properties:
 *         totalTests:
 *           type: integer
 *           example: 25
 *         completedTests:
 *           type: integer
 *           example: 20
 *         averageScore:
 *           type: number
 *           format: float
 *           example: 78.5
 *         totalStudyTime:
 *           type: integer
 *           description: Total study time in minutes
 *           example: 1200
 *         tokensUsed:
 *           type: integer
 *           example: 5000
 *         tokensRemaining:
 *           type: integer
 *           example: 3000
 *         recentActivity:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               activityType:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               details:
 *                 type: object
 *     
 *     DeleteAccountDto:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *         password:
 *           type: string
 *           format: password
 *           example: MySecurePassword123!
 *         reason:
 *           type: string
 *           example: No longer need the service
 *     
 *     UserListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *               example: 1
 *             totalPages:
 *               type: integer
 *               example: 10
 *             totalItems:
 *               type: integer
 *               example: 100
 *             itemsPerPage:
 *               type: integer
 *               example: 10
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Error message
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: ERROR_CODE
 *             details:
 *               type: object
 */

/**
 * User Routes
 */
const router = Router();

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/profile', authMiddleware, userController.getProfile.bind(userController));

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDto'
 *           examples:
 *             updateBasicInfo:
 *               summary: Update basic information
 *               value:
 *                 name: John Doe
 *                 mbbsYear: 3
 *                 phoneNumber: +919876543210
 *             updateFullProfile:
 *               summary: Update complete profile
 *               value:
 *                 name: Jane Smith
 *                 profilePicture: https://example.com/profile.jpg
 *                 mbbsYear: 2
 *                 college: Government Medical College
 *                 university: State University
 *                 batchYear: 2023
 *                 phoneNumber: +919876543210
 *                 dateOfBirth: 2000-05-15T00:00:00Z
 *                 gender: female
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: Profile updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
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
 */
router.put(
  '/profile',
  authMiddleware,
  validate(updateUserSchema),
  userController.updateProfile.bind(userController)
);

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve comprehensive statistics for the authenticated user including test scores, study time, and token usage
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserStats'
 *             example:
 *               success: true
 *               data:
 *                 totalTests: 25
 *                 completedTests: 20
 *                 averageScore: 78.5
 *                 totalStudyTime: 1200
 *                 tokensUsed: 5000
 *                 tokensRemaining: 3000
 *                 recentActivity:
 *                   - activityType: TEST_COMPLETED
 *                     timestamp: 2024-11-20T10:30:00Z
 *                     details:
 *                       testName: Anatomy Quiz
 *                       score: 85
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', authMiddleware, userController.getUserStats.bind(userController));

/**
 * @swagger
 * /api/v1/users/account:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete the authenticated user's account. This action cannot be undone.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteAccountDto'
 *           example:
 *             password: MySecurePassword123!
 *             reason: Moving to a different platform
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: Account deleted successfully
 *       400:
 *         description: Validation error or incorrect password
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
 */
router.delete(
  '/account',
  authMiddleware,
  validate(deleteAccountSchema),
  userController.deleteAccount.bind(userController)
);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get users list (Admin)
 *     description: Retrieve a paginated list of all users. Supports filtering and search.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *         example: john
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [STUDENT, ADMIN]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by account status
 *     responses:
 *       200:
 *         description: Users list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: clxxx123456789
 *                   email: student1@example.com
 *                   name: John Doe
 *                   role: STUDENT
 *                   isActive: true
 *                 - id: clxxx987654321
 *                   email: student2@example.com
 *                   name: Jane Smith
 *                   role: STUDENT
 *                   isActive: true
 *               pagination:
 *                 currentPage: 1
 *                 totalPages: 10
 *                 totalItems: 100
 *                 itemsPerPage: 10
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', authMiddleware, userController.getUsers.bind(userController));

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     summary: Get user by ID (Admin)
 *     description: Retrieve detailed information about a specific user by their ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User CUID
 *         example: clxxx123456789
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID format
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
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:userId',
  authMiddleware,
  validate(getUserByIdSchema),
  userController.getUserById.bind(userController)
);

export { router as userRoutes };