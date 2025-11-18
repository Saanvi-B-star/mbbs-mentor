/**
 * Subject Module Types
 */

/**
 * Create Subject DTO
 */
export interface CreateSubjectDto {
  name: string;
  code: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  mbbsYear?: number;
  sortOrder?: number;
}

/**
 * Update Subject DTO
 */
export interface UpdateSubjectDto extends Partial<CreateSubjectDto> {}

/**
 * Subject Response DTO
 */
export interface SubjectResponseDto {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  iconUrl?: string | null;
  color?: string | null;
  mbbsYear?: number | null;
  sortOrder?: number | null;
  isActive: boolean;
  topicCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subject with Topics Response DTO
 */
export interface SubjectWithTopicsDto extends SubjectResponseDto {
  topics: any[];
}

/**
 * Subject Statistics DTO
 */
export interface SubjectStatsDto {
  id: string;
  topicCount: number;
  materialCount: number;
  questionCount: number;
}
