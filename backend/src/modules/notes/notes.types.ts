import { NoteProcStatus } from '@prisma/client';

/**
 * Notes Module Types
 */

/**
 * Upload Note DTO
 */
export interface UploadNoteDto {
  title?: string;
  tags?: string[];
}

/**
 * Update Note DTO
 */
export interface UpdateNoteDto {
  title?: string;
  tags?: string[];
  isPublic?: boolean;
  allowDownload?: boolean;
}

/**
 * Note Response DTO
 */
export interface NoteResponseDto {
  id: string;
  title: string;
  originalFileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  processingStatus: NoteProcStatus;
  extractedText?: string | null;
  content?: string | null;
  formattedNotes?: string | null;
  summary?: string | null;
  pageCount?: number | null;
  wordCount?: number | null;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate Flashcards DTO
 */
export interface GenerateFlashcardsDto {
  count?: number;
}

/**
 * Flashcard Response
 */
export interface FlashcardDto {
  front: string;
  back: string;
}

/**
 * Search Query DTO for notes extraction
 */
export interface NoteSearchQueryDto {
  searchTerm?: string;
  tags?: string[];
  status?: NoteProcStatus;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'title' | 'wordCount' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Extract by Tags DTO
 */
export interface NoteExtractByTagsDto {
  tags: string[];
  page?: number;
  limit?: number;
}

/**
 * Extract by Date Range DTO
 */
export interface NoteExtractByDateRangeDto {
  startDate: Date | string;
  endDate: Date | string;
  page?: number;
  limit?: number;
}

/**
 * Note Statistics DTO
 */
export interface NoteStatisticsDto {
  totalNotes: number;
  completedNotes: number;
  processingNotes: number;
  failedNotes: number;
  pendingNotes: number;
  totalStorageUsed: number;
  totalWords: number;
  uniqueTags: string[];
  averageProcessingTime: number;
}

/**
 * Extract by Topic DTO
 */
export interface NoteExtractByTopicDto {
  topicId: string;
  page?: number;
  limit?: number;
}

/**
 * Notes by Subject DTO
 */
export interface NoteExtractBySubjectDto {
  subjectId: string;
  page?: number;
  limit?: number;
}

/**
 * Topic with Notes DTO
 */
export interface TopicWithNotesDto {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  totalNotes: number;
  notes: NoteResponseDto[];
}

