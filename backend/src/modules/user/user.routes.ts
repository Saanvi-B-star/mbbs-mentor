import { Router } from 'express';
import { userController } from './user.controller';
import { validate, authMiddleware } from '@/middleware';
import { updateUserSchema, getUserByIdSchema, deleteAccountSchema } from './user.validation';

/**
 * User Routes
 */
const router = Router();

/**
 * All routes require authentication
 */

// Get current user profile
router.get('/profile', authMiddleware, userController.getProfile.bind(userController));

// Update current user profile
router.put(
  '/profile',
  authMiddleware,
  validate(updateUserSchema),
  userController.updateProfile.bind(userController)
);

// Get user statistics
router.get('/stats', authMiddleware, userController.getUserStats.bind(userController));

// Delete user account
router.delete(
  '/account',
  authMiddleware,
  validate(deleteAccountSchema),
  userController.deleteAccount.bind(userController)
);

/**
 * Admin routes (TODO: Add admin middleware)
 */

// Get users list
router.get('/', authMiddleware, userController.getUsers.bind(userController));

// Get user by ID
router.get(
  '/:userId',
  authMiddleware,
  validate(getUserByIdSchema),
  userController.getUserById.bind(userController)
);

export { router as userRoutes };
