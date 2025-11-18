import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException, ForbiddenException } from '@/shared/exceptions';
import { verifyAccessToken } from '@/shared/utils';
import { prisma } from '@/config';
import { UserRole } from '@prisma/client';

/**
 * Extend Express Request to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided', 'AUTH_TOKEN_MISSING');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isBanned: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found', 'AUTH_USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive', 'AUTH_ACCOUNT_INACTIVE');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Account has been banned', 'AUTH_ACCOUNT_BANNED');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user to request if token is provided, but doesn't throw error if not
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isBanned: true,
        },
      });

      if (user && user.isActive && !user.isBanned) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role(s)
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException('Authentication required', 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenException(
          'You do not have permission to access this resource',
          'AUTH_INSUFFICIENT_PERMISSIONS'
        )
      );
    }

    next();
  };
};

/**
 * Admin Only Middleware
 */
export const requireAdmin = requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);

/**
 * Super Admin Only Middleware
 */
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);
