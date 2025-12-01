// src/modules/studentgoals/studentGoals.controller.ts

import { Request, Response, NextFunction } from 'express';
import { studentGoalsService } from './studentGoals.service';
import { CreateStudentGoalsDto, UpdateStudentGoalsDto } from './studentGoals.types';
import { GoalType } from '@prisma/client';

export class StudentGoalsController {
  /**
   * Create student goals
   * POST /api/v1/student-goals
   */
  async createStudentGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data: CreateStudentGoalsDto = req.body;

      const studentGoals = await studentGoalsService.createStudentGoals(userId, data);

      res.status(201).json({
        success: true,
        message: 'Student goals created successfully',
        data: studentGoals
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student goals for current user
   * GET /api/v1/student-goals
   */
  async getStudentGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const studentGoals = await studentGoalsService.getStudentGoals(userId);

      res.status(200).json({
        success: true,
        data: studentGoals
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update student goals
   * PUT /api/v1/student-goals
   */
  async updateStudentGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data: UpdateStudentGoalsDto = req.body;

      const studentGoals = await studentGoalsService.updateStudentGoals(userId, data);

      res.status(200).json({
        success: true,
        message: 'Student goals updated successfully',
        data: studentGoals
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete student goals
   * DELETE /api/v1/student-goals
   */
  async deleteStudentGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      await studentGoalsService.deleteStudentGoals(userId);

      res.status(200).json({
        success: true,
        message: 'Student goals deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all available goal options
   * GET /api/v1/student-goals/available
   */
  async getAvailableGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const availableGoals = studentGoalsService.getAvailableGoals();

      res.status(200).json({
        success: true,
        data: availableGoals
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a single goal
   * POST /api/v1/student-goals/add
   */
  async addGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { goalType } = req.body;

      const studentGoals = await studentGoalsService.addGoal(userId, goalType as GoalType);

      res.status(200).json({
        success: true,
        message: 'Goal added successfully',
        data: studentGoals
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a single goal
   * POST /api/v1/student-goals/remove
   */
  async removeGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { goalType } = req.body;

      const studentGoals = await studentGoalsService.removeGoal(userId, goalType as GoalType);

      res.status(200).json({
        success: true,
        message: 'Goal removed successfully',
        data: studentGoals
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user has specific goal
   * GET /api/v1/student-goals/check/:goalType
   */
  async checkGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { goalType } = req.params;

      const hasGoal = await studentGoalsService.hasGoal(userId, goalType as GoalType);

      res.status(200).json({
        success: true,
        data: { hasGoal }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const studentGoalsController = new StudentGoalsController();