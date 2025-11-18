import { prisma } from '@/config';
import { UpdateUserDto } from './user.types';

/**
 * User Repository
 * Handles all user-related database operations
 */
export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            plan: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Update user profile
   */
  async update(userId: string, data: UpdateUserDto) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete user account
   */
  async softDelete(userId: string, reason?: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        banReason: reason || 'User requested account deletion',
      },
    });
  }

  /**
   * Hard delete user account (for GDPR compliance)
   */
  async hardDelete(userId: string) {
    return await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const [
      studySessionCount,
      testAttemptCount,
      bookmarkCount,
      conversationCount,
      tokensThisMonth,
      averageScore,
    ] = await Promise.all([
      // Count study sessions
      prisma.studySession.count({
        where: { userId },
      }),

      // Count test attempts
      prisma.testAttempt.count({
        where: { userId },
      }),

      // Count bookmarks
      prisma.bookmark.count({
        where: { userId },
      }),

      // Count AI conversations
      prisma.aIConversation.count({
        where: { userId },
      }),

      // Tokens spent this month
      prisma.tokenTransaction.aggregate({
        where: {
          userId,
          transactionType: 'SPENT',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: {
          amount: true,
        },
      }),

      // Average test score
      prisma.testAttempt.aggregate({
        where: {
          userId,
          status: 'COMPLETED',
        },
        _avg: {
          percentage: true,
        },
      }),
    ]);

    return {
      totalStudySessions: studySessionCount,
      totalTestAttempts: testAttemptCount,
      totalBookmarks: bookmarkCount,
      totalAIConversations: conversationCount,
      tokensUsedThisMonth: Math.abs(tokensThisMonth._sum.amount || 0),
      averageTestScore: averageScore._avg.percentage
        ? Number(averageScore._avg.percentage)
        : undefined,
    };
  }

  /**
   * Check if user exists
   */
  async exists(userId: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { id: userId },
    });
    return count > 0;
  }

  /**
   * Get users list (for admin)
   */
  async findMany(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 10, search, role, isActive } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          profilePicture: true,
          currentTokenBalance: true,
          subscriptionStatus: true,
          isActive: true,
          isBanned: true,
          lastLogin: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const userRepository = new UserRepository();
