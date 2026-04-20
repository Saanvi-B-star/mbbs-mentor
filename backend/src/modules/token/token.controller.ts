import { Request, Response, NextFunction } from 'express';
import { tokenService } from './token.service';
import { HTTP_STATUS } from '@/shared/constants';
import { DeductTokensDto, AddTokensDto, TokenTransactionQuery } from './token.types';

/**
 * Token Controller
 * Handles HTTP requests for token operations
 */
export class TokenController {
  /**
   * Get current user's token balance
   * GET /api/v1/tokens/balance
   */
  async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;

      const result = await tokenService.getBalance(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get token transaction history
   * GET /api/v1/tokens/transactions
   */
  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;
      const query: TokenTransactionQuery = req.query as any;

      const result = await tokenService.getTransactions(userId, query);

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
   * Get transaction by ID
   * GET /api/v1/tokens/transactions/:transactionId
   */
  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transactionId = req.params.transactionId as string;

      const result = await tokenService.getTransactionById(transactionId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get token usage by feature
   * GET /api/v1/tokens/usage
   */
  async getUsageByFeature(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await tokenService.getUsageByFeature(userId, startDate, endDate);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deduct tokens (internal use - called by other services)
   * POST /api/v1/tokens/deduct
   */
  async deductTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any).id;
      const { amount, feature, referenceId, description }: Omit<DeductTokensDto, 'userId'> =
        req.body;

      const result = await tokenService.deductTokens({
        userId,
        amount,
        feature,
        referenceId,
        description,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Tokens deducted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add tokens (admin only)
   * POST /api/v1/tokens/add
   */
  async addTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: AddTokensDto = req.body;

      const result = await tokenService.addTokens(data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Tokens added successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Award bonus tokens
   * POST /api/v1/tokens/bonus
   */
  async awardBonus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, amount, description } = req.body;

      const result = await tokenService.awardBonus(userId, amount, description);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Bonus tokens awarded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refund tokens
   * POST /api/v1/tokens/refund
   */
  async refundTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, amount, referenceId, description } = req.body;

      const result = await tokenService.refundTokens(userId, amount, referenceId, description);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Tokens refunded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const tokenController = new TokenController();
