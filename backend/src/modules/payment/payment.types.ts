import { PaymentStatus } from '@prisma/client';

/**
 * Payment Module Types
 */

/**
 * Create Order DTO
 */
export interface CreateOrderDto {
  planId: string;
  currency?: string;
}

/**
 * Create Order Response
 */
export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  planDetails: {
    name: string;
    displayName: string;
    tokenAllocation: number;
    billingCycle: string;
  };
}

/**
 * Verify Payment DTO
 */
export interface VerifyPaymentDto {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

/**
 * Verify Payment Response
 */
export interface VerifyPaymentResponse {
  success: boolean;
  transactionId: string;
  subscriptionId: string;
  message: string;
}

/**
 * Webhook DTO
 */
export interface WebhookDto {
  event: string;
  payload: any;
  signature: string;
}

/**
 * Payment Transaction DTO
 */
export interface PaymentTransactionDto {
  id: string;
  userId: string;
  subscriptionId?: string | null;
  amount: number;
  currency: string;
  paymentMethod?: string | null;
  paymentGateway: string;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  status: PaymentStatus;
  description?: string | null;
  createdAt: Date;
}

/**
 * Subscription Details DTO
 */
export interface SubscriptionDetailsDto {
  id: string;
  planName: string;
  status: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  nextBillingDate?: Date | null;
}

/**
 * Payment History Query
 */
export interface PaymentHistoryQuery {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}
