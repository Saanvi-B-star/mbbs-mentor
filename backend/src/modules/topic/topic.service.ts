import { topicRepository } from './topic.repository';
import { subjectRepository } from '../subject/subject.repository';
import {
  CreateTopicDto,
  UpdateTopicDto,
  TopicResponseDto,
  TopicWithMaterialsDto,
  TopicHierarchyItem,
  TopicStatsDto,
} from './topic.types';
import {
  NotFoundException,
  BadRequestException,
} from '@/shared/exceptions';
import { ERROR_CODES } from '@/shared/constants';

/**
 * Topic Service
 * Handles all topic-related business logic
 */
export class TopicService {
  /**
   * Get all topics
   */
  async getAllTopics(options: {
    page?: number;
    limit?: number;
    subjectId?: string;
  }) {
    const { page = 1, limit = 10, subjectId } = options;

    const result = await topicRepository.findAll({
      page,
      limit,
      subjectId,
      isActive: true,
    });

    return {
      topics: result.topics.map((topic) => this.mapToResponseDto(topic)),
      pagination: result.pagination,
    };
  }

  /**
   * Get topic by ID
   */
  async getTopicById(id: string): Promise<TopicResponseDto> {
    const topic = await topicRepository.findById(id);

    if (!topic) {
      throw new NotFoundException('Topic not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!topic.isActive) {
      throw new NotFoundException('Topic not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return this.mapToResponseDto(topic);
  }

  /**
   * Create new topic (Admin only)
   */
  async createTopic(data: CreateTopicDto): Promise<TopicResponseDto> {
    // Check if subject exists
    const subjectExists = await subjectRepository.exists(data.subjectId);
    if (!subjectExists) {
      throw new NotFoundException('Subject not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // If parent topic is specified, validate it
    if (data.parentTopicId) {
      const parentExists = await topicRepository.exists(data.parentTopicId);
      if (!parentExists) {
        throw new NotFoundException('Parent topic not found', ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      // Check that parent topic belongs to the same subject
      const parentTopic = await topicRepository.findById(data.parentTopicId);
      if (parentTopic && parentTopic.subjectId !== data.subjectId) {
        throw new BadRequestException(
          'Parent topic must belong to the same subject',
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    const topic = await topicRepository.create(data);

    return this.mapToResponseDto(topic);
  }

  /**
   * Update topic (Admin only)
   */
  async updateTopic(id: string, data: UpdateTopicDto): Promise<TopicResponseDto> {
    // Check if topic exists
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw new NotFoundException('Topic not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // If subject is being updated, validate it
    if (data.subjectId && data.subjectId !== topic.subjectId) {
      const subjectExists = await subjectRepository.exists(data.subjectId);
      if (!subjectExists) {
        throw new NotFoundException('Subject not found', ERROR_CODES.RESOURCE_NOT_FOUND);
      }
    }

    // If parent topic is being updated, validate it
    if (data.parentTopicId !== undefined) {
      if (data.parentTopicId) {
        // Check if parent topic exists
        const parentExists = await topicRepository.exists(data.parentTopicId);
        if (!parentExists) {
          throw new NotFoundException('Parent topic not found', ERROR_CODES.RESOURCE_NOT_FOUND);
        }

        // Check for circular reference
        const hasCircular = await topicRepository.hasCircularReference(id, data.parentTopicId);
        if (hasCircular) {
          throw new BadRequestException(
            'Cannot set parent topic: circular reference detected',
            ERROR_CODES.VALIDATION_ERROR
          );
        }

        // Check that parent topic belongs to the same subject
        const parentTopic = await topicRepository.findById(data.parentTopicId);
        const targetSubjectId = data.subjectId || topic.subjectId;
        if (parentTopic && parentTopic.subjectId !== targetSubjectId) {
          throw new BadRequestException(
            'Parent topic must belong to the same subject',
            ERROR_CODES.VALIDATION_ERROR
          );
        }
      }
    }

    const updatedTopic = await topicRepository.update(id, data);

    return this.mapToResponseDto(updatedTopic);
  }

  /**
   * Delete topic (Admin only)
   */
  async deleteTopic(id: string): Promise<void> {
    // Check if topic exists
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw new NotFoundException('Topic not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Check if topic has child topics
    const childTopics = await topicRepository.findChildren(id);
    if (childTopics.length > 0) {
      throw new BadRequestException(
        'Cannot delete topic with child topics. Please delete all child topics first.',
        ERROR_CODES.RESOURCE_CONFLICT
      );
    }

    // Check if topic has materials or questions
    const stats = await topicRepository.getTopicStats(id);
    if (stats.materialCount > 0 || stats.questionCount > 0) {
      throw new BadRequestException(
        'Cannot delete topic with existing materials or questions. Please remove them first.',
        ERROR_CODES.RESOURCE_CONFLICT
      );
    }

    // Soft delete topic
    await topicRepository.delete(id);
  }

  /**
   * Get topic hierarchy for a subject
   */
  async getTopicHierarchy(subjectId: string): Promise<TopicHierarchyItem[]> {
    // Check if subject exists
    const subjectExists = await subjectRepository.exists(subjectId);
    if (!subjectExists) {
      throw new NotFoundException('Subject not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return await topicRepository.getTopicHierarchy(subjectId);
  }

  /**
   * Get topic with materials
   */
  async getTopicWithMaterials(id: string): Promise<TopicWithMaterialsDto> {
    const topic = await topicRepository.findByIdWithMaterials(id);

    if (!topic) {
      throw new NotFoundException('Topic not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!topic.isActive) {
      throw new NotFoundException('Topic not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return {
      ...this.mapToResponseDto(topic),
      studyMaterials: topic.studyMaterials,
    };
  }

  /**
   * Get topics by subject
   */
  async getTopicsBySubject(subjectId: string): Promise<TopicResponseDto[]> {
    // Check if subject exists
    const subjectExists = await subjectRepository.exists(subjectId);
    if (!subjectExists) {
      throw new NotFoundException('Subject not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const topics = await topicRepository.findBySubject(subjectId);

    return topics.map((topic) => this.mapToResponseDto(topic));
  }

  /**
   * Get topic statistics
   */
  async getTopicStats(id: string): Promise<TopicStatsDto> {
    // Check if topic exists
    const exists = await topicRepository.exists(id);
    if (!exists) {
      throw new NotFoundException('Topic not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return await topicRepository.getTopicStats(id);
  }

  /**
   * Map topic to response DTO
   */
  private mapToResponseDto(topic: any): TopicResponseDto {
    return {
      id: topic.id,
      subjectId: topic.subjectId,
      parentTopicId: topic.parentTopicId,
      name: topic.name,
      description: topic.description,
      difficultyLevel: topic.difficultyLevel,
      estimatedStudyTime: topic.estimatedStudyTime,
      sortOrder: topic.sortOrder,
      isActive: topic.isActive,
      subject: topic.subject,
      parentTopic: topic.parentTopic,
      childTopics: topic.childTopics,
      materialCount: topic._count?.studyMaterials || topic.materialCount,
      questionCount: topic._count?.questions || topic.questionCount,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
    };
  }
}

export const topicService = new TopicService();
