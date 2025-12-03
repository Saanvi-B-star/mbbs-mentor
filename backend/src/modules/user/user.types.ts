import { UserRole } from '@prisma/client';

/**
 * User Module Types
 */

/**
 * Update User Profile DTO
 */
export interface UpdateUserDto {
  name?: string;
  profilePicture?: string;
  mbbsYear?: number;
  college?: string;
  university?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: string;
  batchYear?: number;
}

/**
 * User Profile Response DTO
 */
export interface UserProfileDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profilePicture?: string | null;
  mbbsYear?: number | null;
  college?: string | null;
  university?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  currentTokenBalance: number;
  totalTokensEarned: number;
  totalTokensSpent: number;
  subscriptionStatus: string;
  subscriptionEndDate?: Date | null;
  emailVerified: boolean;
  lastLogin?: Date | null;
  loginCount: number;
  createdAt: Date;
}

/**
 * User Statistics DTO
 */
export interface UserStatsDto {
  totalStudySessions: number;
  totalTestAttempts: number;
  totalBookmarks: number;
  totalAIConversations: number;
  tokensUsedThisMonth: number;
  averageTestScore?: number;
}

/**
 * Delete Account DTO
 */
export interface DeleteAccountDto {
  password: string;
  reason?: string;
}
