import { TestType, TestStatus, AttemptStatus, DifficultyLevel, QuestionType } from '@prisma/client';

/**
 * Test Types
 * Type definitions for test-related operations
 */

export interface CreateTestDto {
  title?: string;
  testType: TestType; // PRACTICE, MOCK, CUSTOM
  subjectIds?: string[];
  topicIds?: string[];
  totalQuestions: number;
  duration?: number; // in minutes
  difficultyLevel?: DifficultyLevel;
  questionTypes?: QuestionType[];
}

export interface TestResponseDto {
  id: string;
  userId: string;
  title?: string | null;
  testType: string;
  subjectIds: string[];
  topicIds: string[];
  totalQuestions: number;
  duration?: number | null;
  difficultyLevel?: string | null;
  status: string;
  tokenCost?: number | null;
  questions?: TestQuestionDto[];
  createdAt: Date;
}

export interface TestQuestionDto {
  id: string;
  questionId: string;
  order: number;
  marks: number;
  question?: any;
}

export interface StartTestDto {
  testId: string;
}

export interface SubmitAnswerDto {
  testAttemptId: string;
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
  timeTaken?: number;
  isFlagged?: boolean;
}

export interface SubmitTestDto {
  testAttemptId: string;
}

export interface TestAttemptResponseDto {
  id: string;
  testId: string;
  userId: string;
  startTime: Date;
  endTime?: Date | null;
  timeTaken?: number | null;
  totalScore?: number | null;
  maxScore?: number | null;
  percentage?: number | null;
  status: AttemptStatus;
  test?: any;
  answers?: TestAnswerDto[];
}

export interface TestAnswerDto {
  id: string;
  questionId: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
  isCorrect?: boolean | null;
  marksObtained?: number | null;
  timeTaken?: number | null;
  isFlagged: boolean;
}

export interface TestResultDto extends TestAttemptResponseDto {
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  accuracy: number;
  timePerQuestion: number;
  subjectWisePerformance: SubjectPerformance[];
  topicWisePerformance: TopicPerformance[];
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  accuracy: number;
  score: number;
  maxScore: number;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  accuracy: number;
}

export interface TestFilters {
  userId?: string;
  testType?: TestType;
  status?: TestStatus;
}

export interface GenerateTestCriteria {
  title?: string;
  testType: TestType;
  subjectIds?: string[];
  topicIds?: string[];
  totalQuestions: number;
  duration?: number;
  difficultyLevel?: DifficultyLevel;
  questionTypes?: QuestionType[];
}
