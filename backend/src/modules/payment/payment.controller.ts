import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { HTTP_STATUS } from '@/shared/constants';
import {
  CreateOrderDto,
  VerifyPaymentDto,
  WebhookDto,
  PaymentHistoryQuery,
} from './payment.types';

/**
 * Payment Controller
 * Handles HTTP requests for payment operations
 */
export class PaymentController {
  /**
   * Get available subscription plans
   * GET /api/v1/payments/plans
   */
  async getPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.getSubscriptionPlans();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new order
   * POST /api/v1/payments/orders
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;
      const data: CreateOrderDto = req.body;

      const result = await paymentService.createOrder(userId, data);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Order created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify payment
   * POST /api/v1/payments/verify
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: VerifyPaymentDto = req.body;

      const result = await paymentService.verifyPayment(data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Payment verified successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle webhook
   * POST /api/v1/payments/webhook
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const payload = req.body;

      const webhookData: WebhookDto = {
        event: payload.event,
        payload: payload,
        signature,
      };

      await paymentService.handleWebhook(webhookData);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment history
   * GET /api/v1/payments/history
   */
  async getPaymentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;
      const query: PaymentHistoryQuery = req.query as any;

      const result = await paymentService.getPaymentHistory(userId, query);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active subscription
   * GET /api/v1/payments/subscription
   */
  async getActiveSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;

      const result = await paymentService.getActiveSubscription(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel subscription
   * POST /api/v1/payments/subscription/cancel
   */
  async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;
      const { reason } = req.body;

      const result = await paymentService.cancelSubscription(userId, reason);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
