import { DifficultyLevel } from '@prisma/client';

/**
 * Topic Module Types
 */

/**
 * Create Topic DTO
 */
export interface CreateTopicDto {
  subjectId: string;
  parentTopicId?: string;
  name: string;
  description?: string;
  difficultyLevel?: DifficultyLevel;
  estimatedStudyTime?: number;
  sortOrder?: number;
}

/**
 * Update Topic DTO
 */
export interface UpdateTopicDto extends Partial<CreateTopicDto> {}

/**
 * Topic Response DTO
 */
export interface TopicResponseDto {
  id: string;
  subjectId: string;
  parentTopicId?: string | null;
  name: string;
  description?: string | null;
  difficultyLevel?: string | null;
  estimatedStudyTime?: number | null;
  sortOrder?: number | null;
  isActive: boolean;
  subject?: any;
  parentTopic?: any;
  childTopics?: any[];
  materialCount?: number;
  questionCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Topic with Materials Response DTO
 */
export interface TopicWithMaterialsDto extends TopicResponseDto {
  studyMaterials: any[];
}

/**
 * Topic Hierarchy Item
 */
export interface TopicHierarchyItem {
  id: string;
  name: string;
  description?: string | null;
  difficultyLevel?: string | null;
  sortOrder?: number | null;
  childTopics: TopicHierarchyItem[];
  materialCount?: number;
  questionCount?: number;
}

/**
 * Topic Statistics DTO
 */
export interface TopicStatsDto {
  id: string;
  materialCount: number;
  questionCount: number;
  bookmarkCount: number;
  studySessionCount: number;
}
