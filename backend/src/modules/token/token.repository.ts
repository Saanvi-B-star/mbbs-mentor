import { prisma } from '@/config';
import { TransactionType } from '@prisma/client';
import { TokenTransactionQuery } from './token.types';

/**
 * Token Repository
 * Handles all token-related database operations
 */
export class TokenRepository {
  /**
   * Get user's token balance
   */
  async getBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentTokenBalance: true,
        totalTokensEarned: true,
        totalTokensSpent: true,
      },
    });

    return user;
  }

  /**
   * Create token transaction and update balance
   */
  async createTransaction(data: {
    userId: string;
    transactionType: TransactionType;
    amount: number;
    feature?: string;
    referenceId?: string;
    description?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // Get current user balance
      const user = await tx.user.findUnique({
        where: { id: data.userId },
        select: { currentTokenBalance: true, totalTokensEarned: true, totalTokensSpent: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate new balance
      let balanceChange = data.amount;
      if (data.transactionType === 'SPENT') {
        balanceChange = -Math.abs(data.amount);
      }

      const newBalance = user.currentTokenBalance + balanceChange;

      // Create transaction record
      const transaction = await tx.tokenTransaction.create({
        data: {
          userId: data.userId,
          transactionType: data.transactionType,
          amount: data.amount,
          balanceAfter: newBalance,
          feature: data.feature,
          referenceId: data.referenceId,
          description: data.description,
        },
      });

      // Update user balance
      const updateData: any = {
        currentTokenBalance: newBalance,
      };

      if (data.transactionType === 'SPENT') {
        updateData.totalTokensSpent = user.totalTokensSpent + Math.abs(data.amount);
      } else {
        updateData.totalTokensEarned = user.totalTokensEarned + data.amount;
      }

      await tx.user.update({
        where: { id: data.userId },
        data: updateData,
      });

      return {
        transaction,
        newBalance,
      };
    });
  }

  /**
   * Get token transaction history
   */
  async getTransactions(userId: string, query: TokenTransactionQuery) {
    const { page = 1, limit = 20, transactionType, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (transactionType) {
      where.transactionType = transactionType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.tokenTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tokenTransaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string) {
    return await prisma.tokenTransaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get token usage by feature
   */
  async getUsageByFeature(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      userId,
      transactionType: 'SPENT',
      feature: { not: null },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const usageByFeature = await prisma.tokenTransaction.groupBy({
      by: ['feature'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return usageByFeature.map((item) => ({
      feature: item.feature,
      totalTokens: Math.abs(item._sum.amount || 0),
      transactionCount: item._count.id,
    }));
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId: string, requiredAmount: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentTokenBalance: true },
    });

    return user ? user.currentTokenBalance >= requiredAmount : false;
  }
}

export const tokenRepository = new TokenRepository();
