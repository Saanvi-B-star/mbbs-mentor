import { subjectRepository } from './subject.repository';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectResponseDto,
  SubjectWithTopicsDto,
  SubjectStatsDto,
} from './subject.types';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@/shared/exceptions';
import { ERROR_CODES } from '@/shared/constants';

/**
 * Subject Service
 * Handles all subject-related business logic
 */
export class SubjectService {
  /**
   * Get all subjects
   */
  async getAllSubjects(options: {
    page?: number;
    limit?: number;
    mbbsYear?: number;
  }) {
    const { page = 1, limit = 10, mbbsYear } = options;

    const result = await subjectRepository.findAll({
      page,
      limit,
      mbbsYear,
      isActive: true,
    });

    return {
      subjects: result.subjects.map((subject) => this.mapToResponseDto(subject)),
      pagination: result.pagination,
    };
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(id: string): Promise<SubjectResponseDto> {
    const subject = await subjectRepository.findById(id);

    if (!subject) {
      throw new NotFoundException('Subject not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!subject.isActive) {
      throw new NotFoundException('Subject not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return this.mapToResponseDto(subject);
  }

  /**
   * Create new subject (Admin only)
   */
  async createSubject(data: CreateSubjectDto): Promise<SubjectResponseDto> {
    // Check if code is already taken
    const codeAvailable = await subjectRepository.isCodeAvailable(data.code);
    if (!codeAvailable) {
      throw new ConflictException(
        'Subject code already exists',
        ERROR_CODES.RESOURCE_ALREADY_EXISTS
      );
    }

    const subject = await subjectRepository.create(data);

    return this.mapToResponseDto(subject);
  }

  /**
   * Update subject (Admin only)
   */
  async updateSubject(id: string, data: UpdateSubjectDto): Promise<SubjectResponseDto> {
    // Check if subject exists
    const exists = await subjectRepository.exists(id);
    if (!exists) {
      throw new NotFoundException('Subject not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // If code is being updated, check availability
    if (data.code) {
      const codeAvailable = await subjectRepository.isCodeAvailable(data.code, id);
      if (!codeAvailable) {
        throw new ConflictException(
          'Subject code already exists',
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }
    }

    const subject = await subjectRepository.update(id, data);

    return this.mapToResponseDto(subject);
  }

  /**
   * Delete subject (Admin only)
   */
  async deleteSubject(id: string): Promise<void> {
    // Check if subject exists
    const subject = await subjectRepository.findById(id);
    if (!subject) {
      throw new NotFoundException('Subject not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Check if subject has topics
    const stats = await subjectRepository.getSubjectStats(id);
    if (stats.topicCount > 0) {
      throw new BadRequestException(
        'Cannot delete subject with existing topics. Please delete all topics first.',
        ERROR_CODES.RESOURCE_CONFLICT
      );
    }

    // Soft delete subject
    await subjectRepository.delete(id);
  }

  /**
   * Get subject with topics
   */
  async getSubjectWithTopics(id: string): Promise<SubjectWithTopicsDto> {
    const subject = await subjectRepository.findByIdWithTopics(id);

    if (!subject) {
      throw new NotFoundException('Subject not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!subject.isActive) {
      throw new NotFoundException('Subject not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return {
      ...this.mapToResponseDto(subject),
      topics: subject.topics,
    };
  }

  /**
   * Get subject statistics
   */
  async getSubjectStats(id: string): Promise<SubjectStatsDto> {
    // Check if subject exists
    const exists = await subjectRepository.exists(id);
    if (!exists) {
      throw new NotFoundException('Subject not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return await subjectRepository.getSubjectStats(id);
  }

  /**
   * Map subject to response DTO
   */
  private mapToResponseDto(subject: any): SubjectResponseDto {
    return {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      iconUrl: subject.iconUrl,
      color: subject.color,
      mbbsYear: subject.mbbsYear,
      sortOrder: subject.sortOrder,
      isActive: subject.isActive,
      topicCount: subject._count?.topics || subject.topicCount,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };
  }
}

export const subjectService = new SubjectService();
