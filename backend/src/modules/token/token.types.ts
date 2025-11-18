import { TransactionType } from '@prisma/client';

/**
 * Token Module Types
 */

/**
 * Token Transaction DTO
 */
export interface TokenTransactionDto {
  id: string;
  userId: string;
  transactionType: TransactionType;
  amount: number;
  balanceAfter: number;
  feature?: string | null;
  referenceId?: string | null;
  description?: string | null;
  createdAt: Date;
}

/**
 * Token Balance DTO
 */
export interface TokenBalanceDto {
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  lifetimeBalance: number;
}

/**
 * Deduct Tokens DTO
 */
export interface DeductTokensDto {
  userId: string;
  amount: number;
  feature: string;
  referenceId?: string;
  description?: string;
}

/**
 * Add Tokens DTO
 */
export interface AddTokensDto {
  userId: string;
  amount: number;
  transactionType: TransactionType;
  description?: string;
  referenceId?: string;
}

/**
 * Token Transaction History Query
 */
export interface TokenTransactionQuery {
  page?: number;
  limit?: number;
  transactionType?: TransactionType;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Token Transaction Response
 */
export interface TokenTransactionResponse {
  transaction: TokenTransactionDto;
  newBalance: number;
}
