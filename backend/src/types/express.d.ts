import { UserRole } from '@prisma/client';

/**
 * Extend Express Request interface
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
      tokenBalance?: number;
      sessionId?: string;
    }
  }
}

export {};
