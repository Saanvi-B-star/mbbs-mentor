import { paymentRepository } from './payment.repository';
import { razorpayClientService } from './razorpay.client';
import { tokenService } from '../token/token.service';
import {
  CreateOrderDto,
  CreateOrderResponse,
  VerifyPaymentDto,
  VerifyPaymentResponse,
  WebhookDto,
  PaymentHistoryQuery,
} from './payment.types';
import {
  NotFoundException,
  ValidationException,
  ConflictException,
} from '@/shared/exceptions';
import { ERROR_CODES } from '@/shared/constants';
import { razorpayConfig } from '@/config/razorpay.config';
import { logger } from '@/config';

/**
 * Payment Service
 * Handles all payment-related business logic
 */
export class PaymentService {
  /**
   * Create a new order
   */
  async createOrder(userId: string, data: CreateOrderDto): Promise<CreateOrderResponse> {
    // Get subscription plan
    const plan = await paymentRepository.getSubscriptionPlan(data.planId);

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Subscription plan not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Check if user already has an active subscription
    const activeSubscription = await paymentRepository.getUserActiveSubscription(userId);
    if (activeSubscription) {
      throw new ConflictException(
        'User already has an active subscription',
        ERROR_CODES.SUBSCRIPTION_ALREADY_EXISTS
      );
    }

    const currency = data.currency || 'INR';
    const amount = Number(plan.price);

    // Create Razorpay order
    const receipt = `order_${userId}_${Date.now()}`;
    const razorpayOrder = await razorpayClientService.createOrder(
      amount,
      currency,
      receipt,
      {
        userId,
        planId: plan.id,
        planName: plan.name,
      }
    );

    // Create payment transaction record
    await paymentRepository.createTransaction({
      userId,
      amount,
      currency,
      paymentGateway: 'razorpay',
      razorpayOrderId: razorpayOrder.id,
      description: `Subscription: ${plan.displayName}`,
      metadata: {
        planId: plan.id,
        planName: plan.name,
        tokenAllocation: plan.tokenAllocation,
      },
    });

    return {
      orderId: razorpayOrder.id,
      amount,
      currency,
      razorpayKeyId: razorpayConfig.keyId!,
      planDetails: {
        name: plan.name,
        displayName: plan.displayName,
        tokenAllocation: plan.tokenAllocation,
        billingCycle: plan.billingCycle,
      },
    };
  }

  /**
   * Verify payment
   */
  async verifyPayment(data: VerifyPaymentDto): Promise<VerifyPaymentResponse> {
    // Verify signature
    const isValid = razorpayClientService.verifyPaymentSignature(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature
    );

    if (!isValid) {
      throw new ValidationException(
        'Invalid payment signature',
        ERROR_CODES.PAYMENT_VERIFICATION_FAILED
      );
    }

    // Get transaction
    const transaction = await paymentRepository.getTransactionByOrderId(data.razorpayOrderId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Get payment details from Razorpay
    const payment = await razorpayClientService.getPayment(data.razorpayPaymentId);

    // Update transaction
    await paymentRepository.updateTransaction(transaction.id, {
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      status: payment.status === 'captured' ? 'COMPLETED' : 'FAILED',
      paymentMethod: payment.method,
    });

    if (payment.status === 'captured') {
      // Process subscription
      const subscriptionId = await this.processSubscription(transaction);

      return {
        success: true,
        transactionId: transaction.id,
        subscriptionId,
        message: 'Payment verified successfully',
      };
    }

    throw new ValidationException(
      'Payment verification failed',
      ERROR_CODES.PAYMENT_VERIFICATION_FAILED
    );
  }

  /**
   * Process subscription after successful payment
   */
  async processSubscription(transaction: any): Promise<string> {
    const planId = transaction.metadata?.planId;

    if (!planId) {
      throw new ValidationException('Invalid transaction metadata');
    }

    // Get plan details
    const plan = await paymentRepository.getSubscriptionPlan(planId);

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Calculate subscription period
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, plan.billingCycle);

    // Create subscription
    const subscription = await paymentRepository.createSubscription({
      userId: transaction.userId,
      planId: plan.id,
      startDate,
      endDate,
    });

    // Update user subscription status
    await paymentRepository.updateUserSubscription(
      transaction.userId,
      subscription.id,
      endDate
    );

    // Add tokens to user's balance
    await tokenService.addTokens({
      userId: transaction.userId,
      amount: plan.tokenAllocation,
      transactionType: 'EARNED',
      description: `Subscription tokens: ${plan.displayName}`,
      referenceId: subscription.id,
    });

    logger.info(`Subscription processed successfully`, {
      userId: transaction.userId,
      subscriptionId: subscription.id,
      planId: plan.id,
    });

    return subscription.id;
  }

  /**
   * Handle webhook
   */
  async handleWebhook(data: WebhookDto): Promise<void> {
    const { event, payload, signature } = data;

    // Verify webhook signature
    const isValid = razorpayClientService.verifyWebhookSignature(
      JSON.stringify(payload),
      signature
    );

    if (!isValid) {
      throw new ValidationException(
        'Invalid webhook signature',
        ERROR_CODES.PAYMENT_WEBHOOK_INVALID
      );
    }

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(payload);
        break;

      case 'subscription.activated':
        await this.handleSubscriptionActivated(payload);
        break;

      case 'subscription.charged':
        await this.handleSubscriptionCharged(payload);
        break;

      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(payload);
        break;

      case 'subscription.completed':
        await this.handleSubscriptionCompleted(payload);
        break;

      default:
        logger.warn(`Unhandled webhook event: ${event}`);
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId: string, query: PaymentHistoryQuery) {
    return await paymentRepository.getPaymentHistory(userId, query);
  }

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans() {
    return await paymentRepository.getActivePlans();
  }

  /**
   * Get user's active subscription
   */
  async getActiveSubscription(userId: string) {
    return await paymentRepository.getUserActiveSubscription(userId);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, reason?: string) {
    const subscription = await paymentRepository.getUserActiveSubscription(userId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found', ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
    }

    return await paymentRepository.cancelSubscription(subscription.id, reason);
  }

  // Private helper methods

  private calculateEndDate(startDate: Date, billingCycle: string): Date {
    const endDate = new Date(startDate);

    switch (billingCycle.toLowerCase()) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    return endDate;
  }

  private async handlePaymentCaptured(payload: any) {
    logger.info('Payment captured webhook received', { paymentId: payload.payment.entity.id });
    // Additional handling if needed
  }

  private async handlePaymentFailed(payload: any) {
    logger.warn('Payment failed webhook received', { paymentId: payload.payment.entity.id });

    const transaction = await paymentRepository.getTransactionByPaymentId(
      payload.payment.entity.id
    );

    if (transaction) {
      await paymentRepository.updateTransaction(transaction.id, {
        status: 'FAILED',
      });
    }
  }

  private async handleSubscriptionActivated(payload: any) {
    logger.info('Subscription activated webhook received', {
      subscriptionId: payload.subscription.entity.id,
    });
  }

  private async handleSubscriptionCharged(payload: any) {
    logger.info('Subscription charged webhook received', {
      subscriptionId: payload.subscription.entity.id,
    });
  }

  private async handleSubscriptionCancelled(payload: any) {
    logger.info('Subscription cancelled webhook received', {
      subscriptionId: payload.subscription.entity.id,
    });
  }

  private async handleSubscriptionCompleted(payload: any) {
    logger.info('Subscription completed webhook received', {
      subscriptionId: payload.subscription.entity.id,
    });
  }
}

export const paymentService = new PaymentService();
