import { prisma } from '@/config';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionFilters,
  RandomQuestionFilters,
  CreateQuestionOptionDto,
  UpdateQuestionOptionDto,
} from './question.types';
import { QuestionType } from '@prisma/client';

/**
 * Question Repository
 * Handles all question-related database operations
 */
export class QuestionRepository {
  /**
   * Find all questions with filters and pagination
   */
  async findAll(
    filters: QuestionFilters,
    options: {
      page?: number;
      limit?: number;
    }
  ) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.topicId) {
      where.topicId = filters.topicId;
    }

    if (filters.topicIds && filters.topicIds.length > 0) {
      where.topicId = { in: filters.topicIds };
    }

    if (filters.questionType) {
      where.questionType = filters.questionType;
    }

    if (filters.difficultyLevel) {
      where.difficultyLevel = filters.difficultyLevel;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          options: {
            orderBy: { sortOrder: 'asc' },
          },
          topic: {
            select: {
              id: true,
              name: true,
              subjectId: true,
            },
          },
        },
      }),
      prisma.question.count({ where }),
    ]);

    return {
      questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find question by ID
   */
  async findById(id: string, includeOptions: boolean = true) {
    return await prisma.question.findUnique({
      where: { id },
      include: {
        options: includeOptions
          ? {
              orderBy: { sortOrder: 'asc' },
            }
          : false,
        topic: {
          select: {
            id: true,
            name: true,
            subjectId: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find questions by topic
   */
  async findByTopic(topicId: string, page: number = 1, limit: number = 10) {
    return this.findAll({ topicId, isActive: true, isApproved: true }, { page, limit });
  }

  /**
   * Create question with options
   */
  async create(data: CreateQuestionDto, createdById?: string) {
    const { options, ...questionData } = data;

    return await prisma.question.create({
      data: {
        ...questionData,
        createdById,
        options: options
          ? {
              create: options,
            }
          : undefined,
      },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
        topic: {
          select: {
            id: true,
            name: true,
            subjectId: true,
          },
        },
      },
    });
  }

  /**
   * Update question
   */
  async update(id: string, data: UpdateQuestionDto) {
    const { options, ...questionData } = data;

    // If options are provided, we need to handle them separately
    if (options !== undefined) {
      // Delete existing options and create new ones
      await prisma.questionOption.deleteMany({
        where: { questionId: id },
      });

      return await prisma.question.update({
        where: { id },
        data: {
          ...questionData,
          updatedAt: new Date(),
          options: {
            create: options,
          },
        },
        include: {
          options: {
            orderBy: { sortOrder: 'asc' },
          },
          topic: {
            select: {
              id: true,
              name: true,
              subjectId: true,
            },
          },
        },
      });
    }

    return await prisma.question.update({
      where: { id },
      data: {
        ...questionData,
        updatedAt: new Date(),
      },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
        topic: {
          select: {
            id: true,
            name: true,
            subjectId: true,
          },
        },
      },
    });
  }

  /**
   * Delete question (soft delete)
   */
  async delete(id: string) {
    return await prisma.question.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: string) {
    return await prisma.question.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Update question statistics
   */
  async updateStats(id: string, isCorrect: boolean) {
    return await prisma.question.update({
      where: { id },
      data: {
        totalAttempts: {
          increment: 1,
        },
        correctAttempts: isCorrect
          ? {
              increment: 1,
            }
          : undefined,
      },
    });
  }

  /**
   * Find random questions based on filters
   */
  async findRandom(filters: RandomQuestionFilters) {
    const where: any = {
      isActive: true,
      isApproved: true,
    };

    // Build topic filter
    if (filters.topicIds && filters.topicIds.length > 0) {
      where.topicId = { in: filters.topicIds };
    } else if (filters.subjectIds && filters.subjectIds.length > 0) {
      where.topic = {
        subjectId: { in: filters.subjectIds },
      };
    }

    if (filters.difficultyLevel) {
      where.difficultyLevel = filters.difficultyLevel;
    }

    if (filters.questionTypes && filters.questionTypes.length > 0) {
      where.questionType = { in: filters.questionTypes };
    }

    // First, get the count to ensure we have enough questions
    const totalAvailable = await prisma.question.count({ where });

    if (totalAvailable === 0) {
      return [];
    }

    // Calculate random skip to get different questions each time
    const maxSkip = Math.max(0, totalAvailable - filters.count);
    const randomSkip = Math.floor(Math.random() * (maxSkip + 1));

    return await prisma.question.findMany({
      where,
      skip: randomSkip,
      take: Math.min(filters.count, totalAvailable),
      orderBy: {
        usageCount: 'asc', // Prefer less-used questions
      },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
        topic: {
          select: {
            id: true,
            name: true,
            subjectId: true,
          },
        },
      },
    });
  }

  /**
   * Create question option
   */
  async createOption(questionId: string, data: CreateQuestionOptionDto) {
    return await prisma.questionOption.create({
      data: {
        ...data,
        questionId,
      },
    });
  }

  /**
   * Update question option
   */
  async updateOption(optionId: string, data: UpdateQuestionOptionDto) {
    return await prisma.questionOption.update({
      where: { id: optionId },
      data,
    });
  }

  /**
   * Delete question option
   */
  async deleteOption(optionId: string) {
    return await prisma.questionOption.delete({
      where: { id: optionId },
    });
  }

  /**
   * Check if question exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.question.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check if question is used in any test
   */
  async isUsedInTests(id: string): Promise<boolean> {
    const count = await prisma.testQuestion.count({
      where: { questionId: id },
    });
    return count > 0;
  }

  /**
   * Approve question
   */
  async approve(id: string) {
    return await prisma.question.update({
      where: { id },
      data: {
        isApproved: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Bulk create questions
   */
  async bulkCreate(questions: CreateQuestionDto[], createdById?: string) {
    const results = await Promise.all(
      questions.map((questionData) => this.create(questionData, createdById))
    );
    return results;
  }

  /**
   * Get question with full details including usage stats
   */
  async findByIdWithStats(id: string) {
    const question = await this.findById(id, true);

    if (!question) {
      return null;
    }

    // Calculate success rate
    const successRate =
      question.totalAttempts > 0
        ? (question.correctAttempts / question.totalAttempts) * 100
        : 0;

    return {
      ...question,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Find option by ID
   */
  async findOptionById(optionId: string) {
    return await prisma.questionOption.findUnique({
      where: { id: optionId },
    });
  }
}

export const questionRepository = new QuestionRepository();
