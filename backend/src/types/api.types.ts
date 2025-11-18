/**
 * Common API Types
 */

import { User, UserRole } from '@prisma/client';

/**
 * JWT Payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Auth Response
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserPublic;
}

/**
 * Public User Information (safe to expose)
 */
export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profilePicture?: string | null;
  mbbsYear?: number | null;
  college?: string | null;
  currentTokenBalance: number;
  subscriptionStatus: string;
  createdAt: Date;
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
