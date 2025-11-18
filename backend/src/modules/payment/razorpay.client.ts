import { razorpayClient, razorpayConfig } from '@/config/razorpay.config';
import crypto from 'crypto';

/**
 * Razorpay Client Service
 * Wrapper around Razorpay SDK with utility methods
 */
export class RazorpayClientService {
  /**
   * Create a new order
   */
  async createOrder(amount: number, currency: string, receipt: string, notes?: any) {
    try {
      const order = await razorpayClient.orders.create({
        amount: amount * 100, // Convert to paise
        currency,
        receipt,
        notes: notes || {},
      });

      return order;
    } catch (error: any) {
      throw new Error(`Razorpay order creation failed: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const text = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayConfig.keySecret)
        .update(text)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', razorpayConfig.webhookSecret)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string) {
    try {
      return await razorpayClient.payments.fetch(paymentId);
    } catch (error: any) {
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string) {
    try {
      return await razorpayClient.orders.fetch(orderId);
    } catch (error: any) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  /**
   * Create refund
   */
  async createRefund(paymentId: string, amount?: number, notes?: any) {
    try {
      const refundData: any = {
        notes: notes || {},
      };

      if (amount) {
        refundData.amount = amount * 100; // Convert to paise
      }

      return await razorpayClient.payments.refund(paymentId, refundData);
    } catch (error: any) {
      throw new Error(`Refund creation failed: ${error.message}`);
    }
  }

  /**
   * Get refund details
   */
  async getRefund(paymentId: string, refundId: string) {
    try {
      return await razorpayClient.payments.fetchRefund(paymentId, refundId);
    } catch (error: any) {
      throw new Error(`Failed to fetch refund: ${error.message}`);
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(planId: string, totalCount: number, customerId?: string, notes?: any) {
    try {
      const subscriptionData: any = {
        plan_id: planId,
        total_count: totalCount,
        notes: notes || {},
      };

      if (customerId) {
        subscriptionData.customer_id = customerId;
      }

      return await razorpayClient.subscriptions.create(subscriptionData);
    } catch (error: any) {
      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string) {
    try {
      return await razorpayClient.subscriptions.fetch(subscriptionId);
    } catch (error: any) {
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false) {
    try {
      return await razorpayClient.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
    } catch (error: any) {
      throw new Error(`Subscription cancellation failed: ${error.message}`);
    }
  }
}

export const razorpayClientService = new RazorpayClientService();
