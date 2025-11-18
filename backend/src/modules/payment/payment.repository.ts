import { prisma } from '@/config';
import { PaymentStatus } from '@prisma/client';
import { PaymentHistoryQuery } from './payment.types';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Payment Repository
 * Handles all payment-related database operations
 */
export class PaymentRepository {
  /**
   * Create payment transaction
   */
  async createTransaction(data: {
    userId: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    paymentGateway: string;
    razorpayOrderId?: string;
    description?: string;
    metadata?: any;
  }) {
    return await prisma.paymentTransaction.create({
      data: {
        userId: data.userId,
        subscriptionId: data.subscriptionId,
        amount: new Decimal(data.amount),
        currency: data.currency,
        paymentGateway: data.paymentGateway,
        razorpayOrderId: data.razorpayOrderId,
        status: 'PENDING',
        description: data.description,
        metadata: data.metadata,
      },
    });
  }

  /**
   * Update payment transaction
   */
  async updateTransaction(
    transactionId: string,
    data: {
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      status?: PaymentStatus;
      paymentMethod?: string;
      invoiceUrl?: string;
      metadata?: any;
    }
  ) {
    return await prisma.paymentTransaction.update({
      where: { id: transactionId },
      data,
    });
  }

  /**
   * Get transaction by order ID
   */
  async getTransactionByOrderId(razorpayOrderId: string) {
    return await prisma.paymentTransaction.findFirst({
      where: { razorpayOrderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  /**
   * Get transaction by payment ID
   */
  async getTransactionByPaymentId(razorpayPaymentId: string) {
    return await prisma.paymentTransaction.findFirst({
      where: { razorpayPaymentId },
      include: {
        user: true,
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string) {
    return await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId: string, query: PaymentHistoryQuery) {
    const { page = 1, limit = 20, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (status) {
      where.status = status;
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
      prisma.paymentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      }),
      prisma.paymentTransaction.count({ where }),
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
   * Get subscription plan by ID
   */
  async getSubscriptionPlan(planId: string) {
    return await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
  }

  /**
   * Get active subscription plans
   */
  async getActivePlans() {
    return await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Create subscription
   */
  async createSubscription(data: {
    userId: string;
    planId: string;
    startDate: Date;
    endDate: Date;
    razorpaySubscriptionId?: string;
  }) {
    return await prisma.subscription.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        status: 'ACTIVE',
        startDate: data.startDate,
        endDate: data.endDate,
        razorpaySubscriptionId: data.razorpaySubscriptionId,
        nextBillingDate: data.endDate,
      },
    });
  }

  /**
   * Update user subscription status
   */
  async updateUserSubscription(userId: string, subscriptionId: string, endDate: Date) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionId,
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: endDate,
      },
    });
  }

  /**
   * Get user's active subscription
   */
  async getUserActiveSubscription(userId: string) {
    return await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, reason?: string) {
    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancellationDate: new Date(),
        cancellationReason: reason,
        autoRenew: false,
      },
    });
  }
}

export const paymentRepository = new PaymentRepository();
