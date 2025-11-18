import { QuestionType, DifficultyLevel } from '@prisma/client';

/**
 * Question Types
 * Type definitions for question-related operations
 */

export interface CreateQuestionDto {
  topicId?: string;
  questionType: QuestionType; // MCQ, SAQ, IMAGE_BASED, TRUE_FALSE
  questionText: string;
  questionImageUrl?: string;
  explanation?: string;
  difficultyLevel: DifficultyLevel;
  tags?: string[];
  source?: string;
  options?: CreateQuestionOptionDto[]; // For MCQ
}

export interface CreateQuestionOptionDto {
  optionText: string;
  optionImageUrl?: string;
  isCorrect: boolean;
  explanation?: string;
  sortOrder: number;
}

export interface UpdateQuestionDto extends Partial<CreateQuestionDto> {}

export interface QuestionResponseDto {
  id: string;
  topicId?: string | null;
  questionType: string;
  questionText: string;
  questionImageUrl?: string | null;
  explanation?: string | null;
  difficultyLevel: string;
  tags: string[];
  source?: string | null;
  usageCount: number;
  correctAttempts: number;
  totalAttempts: number;
  successRate?: number;
  isActive: boolean;
  isApproved: boolean;
  options?: QuestionOptionDto[];
  topic?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionOptionDto {
  id: string;
  optionText: string;
  optionImageUrl?: string | null;
  isCorrect: boolean;
  explanation?: string | null;
  sortOrder: number;
}

export interface QuestionFilters {
  topicId?: string;
  topicIds?: string[];
  questionType?: QuestionType;
  difficultyLevel?: DifficultyLevel;
  isActive?: boolean;
  isApproved?: boolean;
  tags?: string[];
}

export interface RandomQuestionFilters {
  topicIds?: string[];
  subjectIds?: string[];
  difficultyLevel?: DifficultyLevel;
  questionTypes?: QuestionType[];
  count: number;
}

export interface BulkImportQuestionDto {
  questions: CreateQuestionDto[];
}

export interface UpdateQuestionOptionDto extends Partial<CreateQuestionOptionDto> {}
