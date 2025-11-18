import { userRepository } from './user.repository';
import { UpdateUserDto, UserProfileDto, UserStatsDto, DeleteAccountDto } from './user.types';
import {
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@/shared/exceptions';
import { ERROR_CODES } from '@/shared/constants';
import { comparePassword } from '@/shared/utils';

/**
 * User Service
 * Handles all user-related business logic
 */
export class UserService {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return this.mapToProfileDto(user);
  }

  /**
   * Get user by ID (for admin)
   */
  async getUserById(userId: string): Promise<UserProfileDto> {
    return this.getProfile(userId);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateUserDto): Promise<UserProfileDto> {
    // Check if user exists
    const exists = await userRepository.exists(userId);
    if (!exists) {
      throw new NotFoundException('User not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Update user
    const updatedUser = await userRepository.update(userId, data);

    return this.mapToProfileDto(updatedUser);
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStatsDto> {
    // Check if user exists
    const exists = await userRepository.exists(userId);
    if (!exists) {
      throw new NotFoundException('User not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return await userRepository.getUserStats(userId);
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string, data: DeleteAccountDto): Promise<void> {
    // Get user
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Verify password
    if (user.passwordHash) {
      const isPasswordValid = await comparePassword(data.password, user.passwordHash);

      if (!isPasswordValid) {
        throw new UnauthorizedException(
          'Invalid password',
          ERROR_CODES.AUTH_INVALID_CREDENTIALS
        );
      }
    }

    // Check if user has active subscription
    if (user.subscriptionStatus === 'ACTIVE') {
      throw new ConflictException(
        'Cannot delete account with active subscription. Please cancel subscription first.',
        ERROR_CODES.RESOURCE_CONFLICT
      );
    }

    // Soft delete user
    await userRepository.softDelete(userId, data.reason);
  }

  /**
   * Get users list (for admin)
   */
  async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) {
    return await userRepository.findMany(options);
  }

  /**
   * Map user to profile DTO
   */
  private mapToProfileDto(user: any): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePicture: user.profilePicture,
      mbbsYear: user.mbbsYear,
      college: user.college,
      university: user.university,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      currentTokenBalance: user.currentTokenBalance,
      totalTokensEarned: user.totalTokensEarned,
      totalTokensSpent: user.totalTokensSpent,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount,
      createdAt: user.createdAt,
    };
  }
}

export const userService = new UserService();
