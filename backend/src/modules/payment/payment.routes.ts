import { Router } from 'express';
import { paymentController } from './payment.controller';
import { validate, authMiddleware } from '@/middleware';
import {
  createOrderSchema,
  verifyPaymentSchema,
  getPaymentHistorySchema,
} from './payment.validation';

/**
 * Payment Routes
 */
const router = Router();

/**
 * Public routes
 */

// Get available subscription plans
router.get('/plans', paymentController.getPlans.bind(paymentController));

// Handle Razorpay webhook (no auth required)
router.post('/webhook', paymentController.handleWebhook.bind(paymentController));

/**
 * Protected routes (authentication required)
 */

// Create a new order
router.post(
  '/orders',
  authMiddleware,
  validate(createOrderSchema),
  paymentController.createOrder.bind(paymentController)
);

// Verify payment
router.post(
  '/verify',
  authMiddleware,
  validate(verifyPaymentSchema),
  paymentController.verifyPayment.bind(paymentController)
);

// Get payment history
router.get(
  '/history',
  authMiddleware,
  validate(getPaymentHistorySchema),
  paymentController.getPaymentHistory.bind(paymentController)
);

// Get active subscription
router.get(
  '/subscription',
  authMiddleware,
  paymentController.getActiveSubscription.bind(paymentController)
);

// Cancel subscription
router.post(
  '/subscription/cancel',
  authMiddleware,
  paymentController.cancelSubscription.bind(paymentController)
);

export { router as paymentRoutes };
