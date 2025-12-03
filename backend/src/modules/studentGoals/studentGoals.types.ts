// src/modules/studentgoals/studentGoals.types.ts

import { GoalType } from '@prisma/client';

export interface CreateStudentGoalsDto {
  goals: GoalType[];
}

export interface UpdateStudentGoalsDto {
  goals: GoalType[];
}

export interface StudentGoalsResponse {
  id: string;
  userId: string;
  goals: GoalType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentGoal {
  type: GoalType;
  label: string;
  description: string;
  icon: string;
}

export const AVAILABLE_GOALS: StudentGoal[] = [
  {
    type: GoalType.EXAM_PREPARATION,
    label: 'Exam Preparation',
    description: 'Focus on university exams, NEET PG preparation, and competitive assessments',
    icon: '📝'
  },
  {
    type: GoalType.CONCEPT_MASTERY,
    label: 'Concept Mastery',
    description: 'Deep understanding of medical concepts and building strong foundations',
    icon: '🧠'
  },
  {
    type: GoalType.CLINICAL_SKILLS,
    label: 'Clinical Skills',
    description: 'Practical clinical application, case studies, and patient care skills',
    icon: '🩺'
  },
  {
    type: GoalType.QUICK_REVISION,
    label: 'Quick Revision',
    description: 'High-yield notes, flashcards, and rapid recaps before exams',
    icon: '⚡'
  },
  {
    type: GoalType.INTERNSHIP_READINESS,
    label: 'Internship Readiness',
    description: 'Prepare for real-world ward work, duties, and emergency handling',
    icon: '🏥'
  },
  {
    type: GoalType.CASE_BASED_LEARNING,
    label: 'Case-Based Learning',
    description: 'Learning through real clinical scenarios and problem-solving cases',
    icon: '📋'
  }
];