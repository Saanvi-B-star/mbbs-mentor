import { UserRole } from '@prisma/client';

/**
 * Auth Module Types
 */

/**
 * Register Request DTO
 */
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  mbbsYear?: number;
  college?: string;
  university?: string;
}

/**
 * Login Request DTO
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserPublicInfo;
}

/**
 * Refresh Token Request DTO
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * Google OAuth DTO
 */
export interface GoogleAuthDto {
  token: string;
}

/**
 * Reset Password Request DTO
 */
export interface ResetPasswordRequestDto {
  email: string;
}

/**
 * Reset Password DTO
 */
export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

/**
 * Change Password DTO
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * Verify Email DTO
 */
export interface VerifyEmailDto {
  token: string;
}

/**
 * Public User Info (safe to expose)
 */
export interface UserPublicInfo {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profilePicture?: string | null;
  mbbsYear?: number | null;
  college?: string | null;
  university?: string | null;
  currentTokenBalance: number;
  subscriptionStatus: string;
  emailVerified: boolean;
  createdAt: Date;
}
