// src/modules/studentgoals/studentGoals.validation.ts

import { z } from 'zod';
import { GoalType } from '@prisma/client';

export const createStudentGoalsSchema = z.object({
  goals: z.array(
    z.string()
      .transform(val => val.toUpperCase())
      .pipe(z.nativeEnum(GoalType))
  )
    .min(1, 'At least one goal must be selected')
    .max(6, 'Maximum 6 goals can be selected')
    .refine(
      (goals) => new Set(goals).size === goals.length,
      'Duplicate goals are not allowed'
    )
});

export const updateStudentGoalsSchema = z.object({
  goals: z.array(
    z.string()
      .transform(val => val.toUpperCase())
      .pipe(z.nativeEnum(GoalType))
  )
    .min(1, 'At least one goal must be selected')
    .max(6, 'Maximum 6 goals can be selected')
    .refine(
      (goals) => new Set(goals).size === goals.length,
      'Duplicate goals are not allowed'
    )
});

export const addGoalSchema = z.object({
  goalType: z.string()
    .transform(val => val.toUpperCase())
    .pipe(z.nativeEnum(GoalType))
});

export const removeGoalSchema = z.object({
  goalType: z.string()
    .transform(val => val.toUpperCase())
    .pipe(z.nativeEnum(GoalType))
});

export type CreateStudentGoalsInput = z.infer<typeof createStudentGoalsSchema>;
export type UpdateStudentGoalsInput = z.infer<typeof updateStudentGoalsSchema>;