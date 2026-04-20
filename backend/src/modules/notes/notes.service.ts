import { prisma } from '@/config';
import { uploadToS3 } from '@/shared/utils';
import { NotFoundException, ForbiddenException, BadRequestException } from '@/shared/exceptions';
import { NoteProcStatus } from '@prisma/client';
import {
  NoteResponseDto,
  UpdateNoteDto,
  FlashcardDto,
  NoteSearchQueryDto,
  NoteExtractByTagsDto,
  NoteExtractByDateRangeDto,
  NoteStatisticsDto
} from './notes.types';
import { queueNoteProcessing } from '@/config/queue.config';
import { tokenService } from '../token/token.service';
import { logger } from '@/config';
import { llmService } from '@/modules/llm/llm.service';

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

    // Deduct tokens (10 tokens per note processing)
    try {
      await tokenService.deductTokens({
        userId,
        amount: 10,
        feature: 'note_processing',
        referenceId: note.id,
        description: `Note Processing: ${note.title}`,
      });
    } catch (err) {
      logger.error(`Failed to deduct tokens for note ${note.id}:`, err);
    }

    // Record initial study session for processing/organizing (5 minutes)
    try {
      await prisma.studySession.create({
        data: {
          userId,
          startTime: new Date(),
          endTime: new Date(),
          duration: 300, // 5 minutes in seconds
          activities: {
            type: 'NOTE_UPLOAD',
            noteId: note.id,
            title: note.title,
          },
        },
      });
    } catch (err) {
      logger.error(`Failed to record study session for note upload:`, err);
    }

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

    // Delete file from S3
    if (note.fileUrl && !note.fileUrl.includes('localhost')) {
      const { deleteFromS3, extractS3Key } = require('@/shared/utils');
      try {
        const key = extractS3Key(note.fileUrl);
        await deleteFromS3(key);
      } catch (err) {
        logger.error(`Failed to delete S3 object for note ${note.id}:`, err);
      }
    }


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

    // Integrate with AI service to generate high-yield flashcards
    const prompt = `Based on the following medical notes, generate ${count} high-yield flashcards for medical students. 
Format each flashcard as a JSON object with "front" (question/concept) and "back" (answer/explanation). 
Ensure the content is accurate and focused on exam-relevant details.

Notes Content:
${note.extractedText.substring(0, 5000)}

Return ONLY a JSON array of objects.`;

    const completion = await llmService.chat({
      question: prompt,
      userId: userId,
    });

    try {
      // Extract JSON array from LLM response (handling potential markdown blocks)
      const jsonString = completion.answer.includes('```json') 
        ? completion.answer.split('```json')[1].split('```')[0].trim()
        : completion.answer.trim();
      
      const flashcards = JSON.parse(jsonString);
      return Array.isArray(flashcards) ? flashcards : [];
    } catch (err) {
      logger.error('Failed to parse AI-generated flashcards:', err);
      return [
        {
          front: 'Error generated flashcards',
          back: 'There was an issue processing the AI response. Please try again.',
        },
      ];
    }

  }

  /**
   * Search notes by query (title or tags)
   */
  async searchNotes(
    userId: string,
    query: NoteSearchQueryDto
  ): Promise<any> {
    const { searchTerm, tags, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    // Search by title
    if (searchTerm && searchTerm.trim()) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { summary: { contains: searchTerm, mode: 'insensitive' } },
        { extractedText: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Filter by status
    if (status) {
      where.processingStatus = status;
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const [notes, total] = await Promise.all([
      prisma.userNote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
   * Extract notes by specific tags
   */
  async extractByTags(
    userId: string,
    query: NoteExtractByTagsDto
  ): Promise<any> {
    const { tags, page = 1, limit = 10 } = query;

    if (!tags || tags.length === 0) {
      throw new BadRequestException('At least one tag is required');
    }

    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.userNote.findMany({
        where: {
          userId,
          tags: { hasSome: tags },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userNote.count({
        where: {
          userId,
          tags: { hasSome: tags },
        },
      }),
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
   * Extract notes by date range
   */
  async extractByDateRange(
    userId: string,
    query: NoteExtractByDateRangeDto
  ): Promise<any> {
    const { startDate, endDate, page = 1, limit = 10 } = query;

    if (!startDate || !endDate) {
      throw new BadRequestException('Both startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.userNote.findMany({
        where: {
          userId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userNote.count({
        where: {
          userId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
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
   * Extract notes by processing status
   */
  async extractByStatus(
    userId: string,
    status: NoteProcStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.userNote.findMany({
        where: {
          userId,
          processingStatus: status,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userNote.count({
        where: {
          userId,
          processingStatus: status,
        },
      }),
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
   * Get only processed notes with extracted content
   */
  async getProcessedNotes(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.userNote.findMany({
        where: {
          userId,
          processingStatus: NoteProcStatus.COMPLETED,
          extractedText: { not: null },
        },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          originalFileName: true,
          fileUrl: true,
          extractedText: true,
          formattedNotes: true,
          summary: true,
          pageCount: true,
          wordCount: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userNote.count({
        where: {
          userId,
          processingStatus: NoteProcStatus.COMPLETED,
          extractedText: { not: null },
        },
      }),
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
   * Get note statistics and metrics
   */
  async getNoteStatistics(userId: string): Promise<NoteStatisticsDto> {
    const [
      totalNotes,
      completedNotes,
      processingNotes,
      failedNotes,
      totalSize,
      totalWords,
      allTags,
    ] = await Promise.all([
      prisma.userNote.count({ where: { userId } }),
      prisma.userNote.count({ where: { userId, processingStatus: NoteProcStatus.COMPLETED } }),
      prisma.userNote.count({ where: { userId, processingStatus: NoteProcStatus.PROCESSING } }),
      prisma.userNote.count({ where: { userId, processingStatus: NoteProcStatus.FAILED } }),
      prisma.userNote.aggregate({
        where: { userId },
        _sum: { fileSize: true },
      }),
      prisma.userNote.aggregate({
        where: { userId },
        _sum: { wordCount: true },
      }),
      prisma.userNote.findMany({
        where: { userId },
        select: { tags: true },
      }),
    ]);

    // Calculate unique tags
    const tagsSet = new Set<string>();
    allTags.forEach(note => {
      note.tags?.forEach(tag => tagsSet.add(tag));
    });

    // Calculate average processing time
    const completedNotesData = await prisma.userNote.findMany({
      where: { userId, processingStatus: NoteProcStatus.COMPLETED },
      select: { processingTime: true },
    });

    const avgProcessingTime = completedNotesData.length
      ? completedNotesData.reduce((acc, note) => acc + (note.processingTime || 0), 0) / completedNotesData.length
      : 0;

    return {
      totalNotes,
      completedNotes,
      processingNotes,
      failedNotes,
      pendingNotes: await prisma.userNote.count({ where: { userId, processingStatus: NoteProcStatus.PENDING } }),
      totalStorageUsed: totalSize._sum.fileSize || 0,
      totalWords: totalWords._sum.wordCount || 0,
      uniqueTags: Array.from(tagsSet),
      averageProcessingTime: Math.round(avgProcessingTime),
    };
  }

  /**
   * Export notes as JSON or CSV
   */
  async exportNotes(
    userId: string,
    format: 'json' | 'csv' = 'json',
    filters?: {
      status?: NoteProcStatus;
      tags?: string[];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<any> {
    const where: any = { userId };

    if (filters?.status) {
      where.processingStatus = filters.status;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const notes = await prisma.userNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'json') {
      return {
        exportedAt: new Date().toISOString(),
        totalNotes: notes.length,
        notes: notes.map(this.mapNoteToDto),
      };
    }

    // CSV format
    if (format === 'csv') {
      const headers = [
        'ID',
        'Title',
        'File Name',
        'File Type',
        'File Size',
        'Processing Status',
        'Word Count',
        'Page Count',
        'Tags',
        'Is Public',
        'Created At',
        'Updated At',
      ];

      const rows = notes.map(note => [
        note.id,
        `"${note.title}"`,
        `"${note.originalFileName}"`,
        note.fileType,
        note.fileSize,
        note.processingStatus,
        note.wordCount || '',
        note.pageCount || '',
        `"${(note.tags || []).join(', ')}"`,
        note.isPublic ? 'Yes' : 'No',
        note.createdAt.toISOString(),
        note.updatedAt.toISOString(),
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      return { csv, filename: `notes-export-${Date.now()}.csv` };
    }
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
      content: note.extractedText, // For frontend compatibility
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

  /**
   * Extract notes by topic
   */
  async extractByTopic(
    userId: string,
    topicId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: true },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.userNote.findMany({
        where: {
          userId,
          topicId,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userNote.count({
        where: {
          userId,
          topicId,
        },
      }),
    ]);

    return {
      topicId: topic.id,
      topicName: topic.name,
      subjectId: topic.subjectId,
      subjectName: topic.subject.name,
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
   * Extract notes by subject (all topics under subject)
   */
  async extractBySubject(
    userId: string,
    subjectId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const skip = (page - 1) * limit;

    // Get all topics under this subject
    const topicIds = await prisma.topic.findMany({
      where: { subjectId },
      select: { id: true },
    });

    const topicIdsList = topicIds.map(t => t.id);

    const [notes, total] = await Promise.all([
      prisma.userNote.findMany({
        where: {
          userId,
          topicId: { in: topicIdsList },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userNote.count({
        where: {
          userId,
          topicId: { in: topicIdsList },
        },
      }),
    ]);

    return {
      subjectId: subject.id,
      subjectName: subject.name,
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
   * Get notes organized by topics within a subject
   */
  async getNotesBySubjectTree(
    userId: string,
    subjectId: string
  ): Promise<any> {
    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Get all topics under this subject
    const topics = await prisma.topic.findMany({
      where: { subjectId },
      orderBy: { sortOrder: 'asc' },
      include: {
        userNotes: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const topicsWithNotes = topics.map(topic => ({
      topicId: topic.id,
      topicName: topic.name,
      description: topic.description,
      difficultyLevel: topic.difficultyLevel,
      totalNotes: topic.userNotes.length,
      notes: topic.userNotes.map(this.mapNoteToDto),
    }));

    const totalNotes = topicsWithNotes.reduce((sum, topic) => sum + topic.totalNotes, 0);

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      totalTopics: topics.length,
      totalNotes,
      topics: topicsWithNotes,
    };
  }

  /**
   * Get notes organized by subject (nested structure)
   */
  async getNotesBySubjectsTree(userId: string): Promise<any> {
    // Get all subjects
    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        topics: {
          orderBy: { sortOrder: 'asc' },
          include: {
            userNotes: {
              where: { userId },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    const subjectsWithNotes = subjects.map(subject => ({
      subjectId: subject.id,
      subjectName: subject.name,
      color: subject.color,
      icon: subject.iconUrl,
      totalNotes: subject.topics.reduce((sum, topic) => sum + topic.userNotes.length, 0),
      topics: subject.topics.map(topic => ({
        topicId: topic.id,
        topicName: topic.name,
        difficultyLevel: topic.difficultyLevel,
        totalNotes: topic.userNotes.length,
        notes: topic.userNotes.map(this.mapNoteToDto),
      })),
    }));

    const totalNotes = subjectsWithNotes.reduce((sum, subject) => sum + subject.totalNotes, 0);

    return {
      totalSubjects: subjects.length,
      totalNotes,
      subjects: subjectsWithNotes,
    };
  }
}

export const notesService = new NotesService();
