import { prisma } from '@/config';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomString,
} from '@/shared/utils';
import {
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ValidationException,
} from '@/shared/exceptions';
import { ERROR_CODES } from '@/shared/constants';
import { AuthProvider, UserRole } from '@prisma/client';
import {
  RegisterDto,
  LoginDto,
  LoginResponse,
  UserPublicInfo,
  ChangePasswordDto,
} from './auth.types';

/**
 * Auth Service
 * Handles all authentication business logic
 */
export class AuthService {
  /**
   * Register new user
   */
  async register(data: RegisterDto): Promise<LoginResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists',
        ERROR_CODES.RESOURCE_ALREADY_EXISTS
      );
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Generate email verification token
    const verificationToken = generateRandomString(32);

    // Create user with initial token balance
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        authProvider: AuthProvider.EMAIL,
        mbbsYear: data.mbbsYear,
        college: data.college,
        university: data.university,
        currentTokenBalance: 100, // Initial bonus
        totalTokensEarned: 100,
        role: UserRole.STUDENT,
      },
    });

    // Create initial token transaction
    await prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        transactionType: 'EARNED',
        amount: 100,
        balanceAfter: 100,
        description: 'Welcome bonus',
      },
    });

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDto): Promise<LoginResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        'Invalid email or password',
        ERROR_CODES.AUTH_INVALID_CREDENTIALS
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Account is inactive',
        ERROR_CODES.AUTH_ACCOUNT_INACTIVE
      );
    }

    // Check if account is banned
    if (user.isBanned) {
      throw new UnauthorizedException(
        'Account has been banned',
        ERROR_CODES.AUTH_ACCOUNT_BANNED
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
        ERROR_CODES.AUTH_INVALID_CREDENTIALS
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        loginCount: { increment: 1 },
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found', ERROR_CODES.AUTH_USER_NOT_FOUND);
      }

      if (!user.isActive) {
        throw new UnauthorizedException(
          'Account is inactive',
          ERROR_CODES.AUTH_ACCOUNT_INACTIVE
        );
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
        ERROR_CODES.AUTH_TOKEN_INVALID
      );
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, data: ChangePasswordDto): Promise<void> {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found', ERROR_CODES.AUTH_USER_NOT_FOUND);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(data.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Current password is incorrect',
        ERROR_CODES.AUTH_INVALID_CREDENTIALS
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(data.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists (security)
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = generateRandomString(32);

    // TODO: Store reset token with expiry in database
    // TODO: Send reset email
    // await emailService.sendPasswordResetEmail(email, resetToken);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // TODO: Verify token and get user
    // For now, throw error
    throw new ValidationException('Password reset not implemented yet');
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    // TODO: Verify token and update user
    throw new ValidationException('Email verification not implemented yet');
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<UserPublicInfo> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found', ERROR_CODES.AUTH_USER_NOT_FOUND);
    }

    return this.sanitizeUser(user);
  }

  /**
   * Sanitize user data (remove sensitive fields)
   */
  private sanitizeUser(user: any): UserPublicInfo {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePicture: user.profilePicture,
      mbbsYear: user.mbbsYear,
      college: user.college,
      university: user.university,
      currentTokenBalance: user.currentTokenBalance,
      subscriptionStatus: user.subscriptionStatus,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
