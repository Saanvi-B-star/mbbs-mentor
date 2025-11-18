import { Router } from 'express';
import { tokenController } from './token.controller';
import { validate, authMiddleware } from '@/middleware';
import {
  deductTokensSchema,
  addTokensSchema,
  getTokenTransactionsSchema,
} from './token.validation';

/**
 * Token Routes
 */
const router = Router();

/**
 * All routes require authentication
 */

// Get current user's token balance
router.get('/balance', authMiddleware, tokenController.getBalance.bind(tokenController));

// Get token transaction history
router.get(
  '/transactions',
  authMiddleware,
  validate(getTokenTransactionsSchema),
  tokenController.getTransactions.bind(tokenController)
);

// Get transaction by ID
router.get(
  '/transactions/:transactionId',
  authMiddleware,
  tokenController.getTransactionById.bind(tokenController)
);

// Get token usage by feature
router.get('/usage', authMiddleware, tokenController.getUsageByFeature.bind(tokenController));

// Deduct tokens (for internal use by other services)
router.post(
  '/deduct',
  authMiddleware,
  validate(deductTokensSchema),
  tokenController.deductTokens.bind(tokenController)
);

/**
 * Admin routes (TODO: Add admin middleware)
 */

// Add tokens
router.post(
  '/add',
  authMiddleware,
  validate(addTokensSchema),
  tokenController.addTokens.bind(tokenController)
);

// Award bonus tokens
router.post('/bonus', authMiddleware, tokenController.awardBonus.bind(tokenController));

// Refund tokens
router.post('/refund', authMiddleware, tokenController.refundTokens.bind(tokenController));

export { router as tokenRoutes };
