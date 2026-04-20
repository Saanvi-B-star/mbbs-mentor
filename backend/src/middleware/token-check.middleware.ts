import { Request, Response, NextFunction } from 'express';
import { InsufficientTokensException } from '@/shared/exceptions';
import { prisma } from '@/config';

/**
 * Token Balance Check Middleware
 * Verifies user has sufficient token balance for an operation
 */
export const requireTokens = (requiredTokens: number) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new Error('Authentication required'));
      }

      // Get user's current token balance
      const user = await prisma.user.findUnique({
        where: { id: (req.user as any).id },
        select: { currentTokenBalance: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      if (user.currentTokenBalance < requiredTokens) {
        throw new InsufficientTokensException(
          `Insufficient tokens. Required: ${requiredTokens}, Current: ${user.currentTokenBalance}`,
          'TOKEN_INSUFFICIENT_BALANCE',
          {
            required: requiredTokens,
            current: user.currentTokenBalance,
          }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check Token Balance (non-blocking)
 * Adds token balance info to request but doesn't block if insufficient
 */
export const checkTokenBalance = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (req.user) {
      const user = await prisma.user.findUnique({
        where: { id: (req.user as any).id },
        select: { currentTokenBalance: true },
      });

      if (user) {
        (req as any).tokenBalance = user.currentTokenBalance;
      }
    }

    next();
  } catch (error) {
    // Don't block on error, just log and continue
    console.error('Error checking token balance:', error);
    next();
  }
};
