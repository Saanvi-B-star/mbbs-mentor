import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { HTTP_STATUS } from '@/shared/constants';
import { UpdateUserDto, DeleteAccountDto } from './user.types';

/**
 * User Controller
 * Handles HTTP requests for user operations
 */
export class UserController {
  /**
   * Get current user profile
   * GET /api/v1/users/profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await userService.getProfile(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/users/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: UpdateUserDto = req.body;

      const result = await userService.updateProfile(userId, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   * GET /api/v1/users/stats
   */
  async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await userService.getUserStats(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user account
   * DELETE /api/v1/users/account
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data: DeleteAccountDto = req.body;

      await userService.deleteAccount(userId, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (for admin)
   * GET /api/v1/users/:userId
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const result = await userService.getUserById(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users list (for admin)
   * GET /api/v1/users
   */
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const role = req.query.role as string;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const result = await userService.getUsers({
        page,
        limit,
        search,
        role,
        isActive,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
