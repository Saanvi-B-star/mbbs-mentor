import { prisma } from '@/config';
import { CreateTopicDto, UpdateTopicDto, TopicHierarchyItem } from './topic.types';

/**
 * Topic Repository
 * Handles all topic-related database operations
 */
export class TopicRepository {
  /**
   * Find all topics with optional filters
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    subjectId?: string;
    parentTopicId?: string | null;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 10, subjectId, parentTopicId, isActive } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (subjectId !== undefined) {
      where.subjectId = subjectId;
    }

    if (parentTopicId !== undefined) {
      where.parentTopicId = parentTopicId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          parentTopic: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              studyMaterials: true,
              questions: true,
              childTopics: true,
            },
          },
        },
      }),
      prisma.topic.count({ where }),
    ]);

    return {
      topics: topics.map((topic) => ({
        ...topic,
        materialCount: topic._count.studyMaterials,
        questionCount: topic._count.questions,
        childTopicCount: topic._count.childTopics,
        _count: undefined,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find topic by ID
   */
  async findById(id: string) {
    return await prisma.topic.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        parentTopic: {
          select: {
            id: true,
            name: true,
          },
        },
        childTopics: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            difficultyLevel: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            studyMaterials: true,
            questions: true,
          },
        },
      },
    });
  }

  /**
   * Find topics by subject
   */
  async findBySubject(subjectId: string, includeInactive = false) {
    return await prisma.topic.findMany({
      where: {
        subjectId,
        isActive: includeInactive ? undefined : true,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        parentTopic: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            studyMaterials: true,
            questions: true,
            childTopics: true,
          },
        },
      },
    });
  }

  /**
   * Find child topics
   */
  async findChildren(parentTopicId: string) {
    return await prisma.topic.findMany({
      where: {
        parentTopicId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            studyMaterials: true,
            questions: true,
            childTopics: true,
          },
        },
      },
    });
  }

  /**
   * Create new topic
   */
  async create(data: CreateTopicDto) {
    return await prisma.topic.create({
      data,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        parentTopic: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            studyMaterials: true,
            questions: true,
          },
        },
      },
    });
  }

  /**
   * Update topic
   */
  async update(id: string, data: UpdateTopicDto) {
    return await prisma.topic.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        parentTopic: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            studyMaterials: true,
            questions: true,
          },
        },
      },
    });
  }

  /**
   * Delete topic (soft delete)
   */
  async delete(id: string) {
    return await prisma.topic.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get topic hierarchy for a subject
   */
  async getTopicHierarchy(subjectId: string): Promise<TopicHierarchyItem[]> {
    // Get all topics for the subject
    const topics = await prisma.topic.findMany({
      where: {
        subjectId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            studyMaterials: true,
            questions: true,
          },
        },
      },
    });

    // Build hierarchy
    const topicMap = new Map<string, TopicHierarchyItem>();
    const rootTopics: TopicHierarchyItem[] = [];

    // First pass: create all topic items
    topics.forEach((topic) => {
      topicMap.set(topic.id, {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        difficultyLevel: topic.difficultyLevel,
        sortOrder: topic.sortOrder,
        materialCount: topic._count.studyMaterials,
        questionCount: topic._count.questions,
        childTopics: [],
      });
    });

    // Second pass: build hierarchy
    topics.forEach((topic) => {
      const item = topicMap.get(topic.id)!;
      if (topic.parentTopicId) {
        const parent = topicMap.get(topic.parentTopicId);
        if (parent) {
          parent.childTopics.push(item);
        }
      } else {
        rootTopics.push(item);
      }
    });

    return rootTopics;
  }

  /**
   * Get topic with materials
   */
  async findByIdWithMaterials(id: string) {
    return await prisma.topic.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        parentTopic: {
          select: {
            id: true,
            name: true,
          },
        },
        studyMaterials: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            studyMaterials: true,
            questions: true,
          },
        },
      },
    });
  }

  /**
   * Get topic statistics
   */
  async getTopicStats(id: string) {
    const [materialCount, questionCount, bookmarkCount, studySessionCount] = await Promise.all([
      // Count materials
      prisma.studyMaterial.count({
        where: { topicId: id, isActive: true },
      }),

      // Count questions
      prisma.question.count({
        where: { topicId: id, isActive: true },
      }),

      // Count bookmarks
      prisma.bookmark.count({
        where: {
          bookmarkableId: id,
          bookmarkableType: 'TOPIC',
        },
      }),

      // Count study sessions
      prisma.studySession.count({
        where: { topicId: id },
      }),
    ]);

    return {
      id,
      materialCount,
      questionCount,
      bookmarkCount,
      studySessionCount,
    };
  }

  /**
   * Check if topic exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.topic.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check for circular reference in hierarchy
   */
  async hasCircularReference(topicId: string, parentTopicId: string): Promise<boolean> {
    let currentParentId: string | null = parentTopicId;

    while (currentParentId) {
      if (currentParentId === topicId) {
        return true; // Circular reference detected
      }

      const parent: { parentTopicId: string | null } | null = await prisma.topic.findUnique({
        where: { id: currentParentId },
        select: { parentTopicId: true },
      });

      if (!parent) {
        break;
      }

      currentParentId = parent.parentTopicId;
    }

    return false;
  }
}

export const topicRepository = new TopicRepository();
