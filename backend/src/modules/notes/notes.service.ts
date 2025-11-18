import { prisma } from '@/config';
import { uploadToS3, countWords } from '@/shared/utils';
import { NotFoundException, ForbiddenException } from '@/shared/exceptions';
import { NoteProcStatus } from '@prisma/client';
import { NoteResponseDto, UpdateNoteDto, FlashcardDto } from './notes.types';
import { queueNoteProcessing } from '@/config/queue.config';

/**
 * Notes Service
 * Handles user notes upload and processing
 */
export class NotesService {
  /**
   * Upload note
   */
  async uploadNote(
    userId: string,
    file: Express.Multer.File,
    title?: string,
    tags?: string[]
  ): Promise<NoteResponseDto> {
    // Upload file to S3
    const fileUrl = await uploadToS3(
      file.buffer,
      file.originalname,
      file.mimetype,
      `user-notes/${userId}`
    );

    // Create note record
    const note = await prisma.userNote.create({
      data: {
        userId,
        title: title || file.originalname,
        originalFileName: file.originalname,
        fileUrl,
        fileType: file.mimetype.split('/')[1] || 'unknown',
        fileSize: file.size,
        tags: tags || [],
        processingStatus: NoteProcStatus.PENDING,
      },
    });

    // Add to processing queue
    await queueNoteProcessing(note.id);

    return this.mapNoteToDto(note);
  }

  /**
   * Get user's notes
   */
  async getUserNotes(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: NoteProcStatus
  ) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.processingStatus = status;
    }

    const [notes, total] = await Promise.all([
      prisma.userNote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userNote.count({ where }),
    ]);

    return {
      data: notes.map(this.mapNoteToDto),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get note by ID
   */
  async getNoteById(noteId: string, userId: string): Promise<NoteResponseDto> {
    const note = await prisma.userNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Check ownership
    if (note.userId !== userId) {
      throw new ForbiddenException('You do not have access to this note');
    }

    return this.mapNoteToDto(note);
  }

  /**
   * Update note
   */
  async updateNote(
    noteId: string,
    userId: string,
    data: UpdateNoteDto
  ): Promise<NoteResponseDto> {
    const note = await prisma.userNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You do not have access to this note');
    }

    const updated = await prisma.userNote.update({
      where: { id: noteId },
      data,
    });

    return this.mapNoteToDto(updated);
  }

  /**
   * Delete note
   */
  async deleteNote(noteId: string, userId: string): Promise<void> {
    const note = await prisma.userNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You do not have access to this note');
    }

    // TODO: Delete file from S3
    // await deleteFromS3(note.fileUrl);

    await prisma.userNote.delete({
      where: { id: noteId },
    });
  }

  /**
   * Generate flashcards from note (requires AI integration)
   */
  async generateFlashcards(
    noteId: string,
    userId: string,
    count: number = 10
  ): Promise<FlashcardDto[]> {
    const note = await this.getNoteById(noteId, userId);

    if (note.processingStatus !== NoteProcStatus.COMPLETED) {
      throw new ForbiddenException('Note processing is not completed yet');
    }

    if (!note.extractedText) {
      throw new ForbiddenException('No text content available');
    }

    // TODO: Integrate with AI service to generate flashcards
    // For now, return mock data
    return [
      {
        front: 'Sample Question from your notes',
        back: 'Sample Answer',
      },
    ];
  }

  /**
   * Map note entity to DTO
   */
  private mapNoteToDto(note: any): NoteResponseDto {
    return {
      id: note.id,
      title: note.title,
      originalFileName: note.originalFileName,
      fileUrl: note.fileUrl,
      fileType: note.fileType,
      fileSize: note.fileSize,
      processingStatus: note.processingStatus,
      extractedText: note.extractedText,
      formattedNotes: note.formattedNotes,
      summary: note.summary,
      pageCount: note.pageCount,
      wordCount: note.wordCount,
      tags: note.tags,
      isPublic: note.isPublic,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}

export const notesService = new NotesService();
