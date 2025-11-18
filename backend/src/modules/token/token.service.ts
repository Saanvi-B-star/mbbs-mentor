import { tokenRepository } from './token.repository';
import {
  TokenBalanceDto,
  DeductTokensDto,
  AddTokensDto,
  TokenTransactionQuery,
  TokenTransactionResponse,
} from './token.types';
import { InsufficientTokensException, NotFoundException } from '@/shared/exceptions';
import { ERROR_CODES } from '@/shared/constants';

/**
 * Token Service
 * Handles all token-related business logic
 */
export class TokenService {
  /**
   * Get user's token balance
   */
  async getBalance(userId: string): Promise<TokenBalanceDto> {
    const balance = await tokenRepository.getBalance(userId);

    if (!balance) {
      throw new NotFoundException('User not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return {
      currentBalance: balance.currentTokenBalance,
      totalEarned: balance.totalTokensEarned,
      totalSpent: balance.totalTokensSpent,
      lifetimeBalance: balance.totalTokensEarned - balance.totalTokensSpent,
    };
  }

  /**
   * Deduct tokens from user's balance
   */
  async deductTokens(data: DeductTokensDto): Promise<TokenTransactionResponse> {
    // Check if user has sufficient balance
    const hasSufficient = await tokenRepository.hasSufficientBalance(data.userId, data.amount);

    if (!hasSufficient) {
      const balance = await tokenRepository.getBalance(data.userId);
      throw new InsufficientTokensException(
        `Insufficient tokens. Required: ${data.amount}, Current: ${balance?.currentTokenBalance || 0}`,
        ERROR_CODES.TOKEN_INSUFFICIENT_BALANCE,
        {
          required: data.amount,
          current: balance?.currentTokenBalance || 0,
        }
      );
    }

    // Create deduction transaction
    const result = await tokenRepository.createTransaction({
      userId: data.userId,
      transactionType: 'SPENT',
      amount: data.amount,
      feature: data.feature,
      referenceId: data.referenceId,
      description: data.description || `Used ${data.amount} tokens for ${data.feature}`,
    });

    return {
      transaction: result.transaction,
      newBalance: result.newBalance,
    };
  }

  /**
   * Add tokens to user's balance
   */
  async addTokens(data: AddTokensDto): Promise<TokenTransactionResponse> {
    // Create addition transaction
    const result = await tokenRepository.createTransaction({
      userId: data.userId,
      transactionType: data.transactionType,
      amount: data.amount,
      referenceId: data.referenceId,
      description: data.description || `Added ${data.amount} tokens`,
    });

    return {
      transaction: result.transaction,
      newBalance: result.newBalance,
    };
  }

  /**
   * Get token transaction history
   */
  async getTransactions(userId: string, query: TokenTransactionQuery) {
    return await tokenRepository.getTransactions(userId, query);
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string) {
    const transaction = await tokenRepository.getTransactionById(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return transaction;
  }

  /**
   * Get token usage by feature
   */
  async getUsageByFeature(userId: string, startDate?: Date, endDate?: Date) {
    return await tokenRepository.getUsageByFeature(userId, startDate, endDate);
  }

  /**
   * Refund tokens (for failed operations)
   */
  async refundTokens(
    userId: string,
    amount: number,
    referenceId?: string,
    description?: string
  ): Promise<TokenTransactionResponse> {
    return await this.addTokens({
      userId,
      amount,
      transactionType: 'REFUND',
      referenceId,
      description: description || `Refunded ${amount} tokens`,
    });
  }

  /**
   * Award bonus tokens
   */
  async awardBonus(
    userId: string,
    amount: number,
    description?: string
  ): Promise<TokenTransactionResponse> {
    return await this.addTokens({
      userId,
      amount,
      transactionType: 'BONUS',
      description: description || `Bonus: ${amount} tokens`,
    });
  }
}

export const tokenService = new TokenService();
