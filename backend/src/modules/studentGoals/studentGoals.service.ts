// src/modules/studentgoals/studentGoals.service.ts

import { prisma } from '@/config';
import { GoalType } from '@prisma/client';
import { 
  CreateStudentGoalsDto, 
  UpdateStudentGoalsDto, 
  StudentGoalsResponse,
  AVAILABLE_GOALS 
} from './studentGoals.types';
import { NotFoundException, ConflictException } from '@/shared/exceptions';

class StudentGoalsService {
  /**
   * Create student goals for a user
   */
  async createStudentGoals(userId: string, data: CreateStudentGoalsDto): Promise<StudentGoalsResponse> {
    // Check if user already has goals
    const existingGoals = await prisma.studentGoals.findUnique({
      where: { userId }
    });

    if (existingGoals) {
      throw new ConflictException('Student goals already exist. Use PUT to update.');
    }

    // Create student goals
    const studentGoals = await prisma.studentGoals.create({
      data: {
        userId,
        goals: data.goals
      }
    });

    return studentGoals;
  }

  /**
   * Get student goals for a user
   */
  async getStudentGoals(userId: string): Promise<StudentGoalsResponse | null> {
    const studentGoals = await prisma.studentGoals.findUnique({
      where: { userId }
    });

    return studentGoals;
  }

  /**
   * Update student goals for a user
   */
  async updateStudentGoals(userId: string, data: UpdateStudentGoalsDto): Promise<StudentGoalsResponse> {
    // Check if goals exist
    const existingGoals = await prisma.studentGoals.findUnique({
      where: { userId }
    });

    if (!existingGoals) {
      throw new NotFoundException('Student goals not found. Use POST to create.');
    }

    // Update student goals
    const studentGoals = await prisma.studentGoals.update({
      where: { userId },
      data: {
        goals: data.goals
      }
    });

    return studentGoals;
  }

  /**
   * Delete student goals for a user
   */
  async deleteStudentGoals(userId: string): Promise<void> {
    // Check if goals exist
    const existingGoals = await prisma.studentGoals.findUnique({
      where: { userId }
    });

    if (!existingGoals) {
      throw new NotFoundException('Student goals not found');
    }

    await prisma.studentGoals.delete({
      where: { userId }
    });
  }

  /**
   * Get all available goal options
   */
  getAvailableGoals() {
    return AVAILABLE_GOALS;
  }

  /**
   * Add a single goal to user's existing goals
   */
  async addGoal(userId: string, goalType: GoalType): Promise<StudentGoalsResponse> {
    const existingGoals = await prisma.studentGoals.findUnique({
      where: { userId }
    });

    if (!existingGoals) {
      // Create new goals if none exist
      return await prisma.studentGoals.create({
        data: {
          userId,
          goals: [goalType]
        }
      });
    }

    // Check if goal already exists
    if (existingGoals.goals.includes(goalType)) {
      throw new ConflictException('Goal already exists in user goals');
    }

    // Add new goal
    const updatedGoals = await prisma.studentGoals.update({
      where: { userId },
      data: {
        goals: [...existingGoals.goals, goalType]
      }
    });

    return updatedGoals;
  }

  /**
   * Remove a single goal from user's goals
   */
  async removeGoal(userId: string, goalType: GoalType): Promise<StudentGoalsResponse> {
    const existingGoals = await prisma.studentGoals.findUnique({
      where: { userId }
    });

    if (!existingGoals) {
      throw new NotFoundException('Student goals not found');
    }

    // Check if goal exists
    if (!existingGoals.goals.includes(goalType)) {
      throw new NotFoundException('Goal not found in user goals');
    }

    // Remove goal
    const updatedGoals = await prisma.studentGoals.update({
      where: { userId },
      data: {
        goals: existingGoals.goals.filter(g => g !== goalType)
      }
    });

    return updatedGoals;
  }

  /**
   * Check if user has a specific goal
   */
  async hasGoal(userId: string, goalType: GoalType): Promise<boolean> {
    const existingGoals = await prisma.studentGoals.findUnique({
      where: { userId }
    });

    if (!existingGoals) {
      return false;
    }

    return existingGoals.goals.includes(goalType);
  }
}

export const studentGoalsService = new StudentGoalsService();