import { prisma } from '@/config';
import { CreateSubjectDto, UpdateSubjectDto } from './subject.types';

/**
 * Subject Repository
 * Handles all subject-related database operations
 */
export class SubjectRepository {
  /**
   * Find all subjects with optional filters
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    mbbsYear?: number;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 10, mbbsYear, isActive } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (mbbsYear !== undefined) {
      where.mbbsYear = mbbsYear;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: {
              topics: true,
            },
          },
        },
      }),
      prisma.subject.count({ where }),
    ]);

    return {
      subjects: subjects.map((subject) => ({
        ...subject,
        topicCount: subject._count.topics,
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
   * Find subject by ID
   */
  async findById(id: string) {
    return await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            topics: true,
          },
        },
      },
    });
  }

  /**
   * Find subject by code
   */
  async findByCode(code: string) {
    return await prisma.subject.findUnique({
      where: { code },
    });
  }

  /**
   * Create new subject
   */
  async create(data: CreateSubjectDto) {
    return await prisma.subject.create({
      data,
      include: {
        _count: {
          select: {
            topics: true,
          },
        },
      },
    });
  }

  /**
   * Update subject
   */
  async update(id: string, data: UpdateSubjectDto) {
    return await prisma.subject.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            topics: true,
          },
        },
      },
    });
  }

  /**
   * Delete subject (soft delete)
   */
  async delete(id: string) {
    return await prisma.subject.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get subject statistics
   */
  async getSubjectStats(id: string) {
    const [topicCount, materialCount, questionCount] = await Promise.all([
      // Count topics
      prisma.topic.count({
        where: { subjectId: id, isActive: true },
      }),

      // Count materials through topics
      prisma.studyMaterial.count({
        where: {
          topic: {
            subjectId: id,
          },
          isActive: true,
        },
      }),

      // Count questions through topics
      prisma.question.count({
        where: {
          topic: {
            subjectId: id,
          },
          isActive: true,
        },
      }),
    ]);

    return {
      id,
      topicCount,
      materialCount,
      questionCount,
    };
  }

  /**
   * Get subject with topics
   */
  async findByIdWithTopics(id: string) {
    return await prisma.subject.findUnique({
      where: { id },
      include: {
        topics: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            topics: true,
          },
        },
      },
    });
  }

  /**
   * Check if subject exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.subject.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check if code is available
   */
  async isCodeAvailable(code: string, excludeId?: string): Promise<boolean> {
    const count = await prisma.subject.count({
      where: {
        code,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    return count === 0;
  }
}

export const subjectRepository = new SubjectRepository();
