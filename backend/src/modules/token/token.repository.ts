import { prisma } from '@/config';
import { Prisma, TransactionType } from '@prisma/client';
import { TokenTransactionQuery } from './token.types';
import { InsufficientTokensException } from '@/shared/exceptions';
import { ERROR_CODES } from '@/shared/constants';

type CreateTransactionData = {
  userId: string;
  transactionType: TransactionType;
  amount: number;
  feature?: string;
  referenceId?: string;
  description?: string;
};

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
  async createTransaction(data: CreateTransactionData) {
    return prisma.$transaction((tx) => this.createTransactionInTransaction(tx, data));
  }

  async createTransactionOnce(data: CreateTransactionData & { referenceId: string }) {
    return prisma.$transaction((tx) => this.createTransactionOnceInTransaction(tx, data));
  }

  async createTransactionOnceInTransaction(
    tx: Prisma.TransactionClient,
    data: CreateTransactionData & { referenceId: string }
  ) {
    await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${data.userId} FOR UPDATE`;
    const existing = await tx.tokenTransaction.findFirst({
      where: {
        userId: data.userId,
        transactionType: data.transactionType,
        feature: data.feature,
        referenceId: data.referenceId,
      },
    });
    if (existing) {
      return { transaction: existing, newBalance: existing.balanceAfter };
    }

    const user = await tx.user.findUnique({
      where: { id: data.userId },
      select: { currentTokenBalance: true },
    });
    if (!user) {
      throw new Error('User not found');
    }
    if (data.transactionType === 'SPENT' && user.currentTokenBalance < data.amount) {
      throw new InsufficientTokensException(
        `Insufficient tokens. Required: ${data.amount}, Current: ${user.currentTokenBalance}`,
        ERROR_CODES.TOKEN_INSUFFICIENT_BALANCE,
        { required: data.amount, current: user.currentTokenBalance }
      );
    }

    return this.createTransactionInTransaction(tx, data);
  }

  private async createTransactionInTransaction(
    tx: Prisma.TransactionClient,
    data: CreateTransactionData
  ) {
    const user = await tx.user.findUnique({
      where: { id: data.userId },
      select: { currentTokenBalance: true, totalTokensEarned: true, totalTokensSpent: true },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const balanceChange = data.transactionType === 'SPENT' ? -Math.abs(data.amount) : data.amount;
    const newBalance = user.currentTokenBalance + balanceChange;
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

    await tx.user.update({
      where: { id: data.userId },
      data: {
        currentTokenBalance: newBalance,
        ...(data.transactionType === 'SPENT'
          ? { totalTokensSpent: user.totalTokensSpent + Math.abs(data.amount) }
          : { totalTokensEarned: user.totalTokensEarned + data.amount }),
      },
    });

    return { transaction, newBalance };
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
