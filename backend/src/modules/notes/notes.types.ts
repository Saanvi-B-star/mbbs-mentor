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
