import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { config } from './environment';

/**
 * Prisma Client instance with logging configuration
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.isDevelopment
      ? [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'stdout' },
          { level: 'info', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
        ]
      : [
          { level: 'error', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
        ],
  });
};

/**
 * Global prisma client singleton
 */
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

/**
 * Prisma client instance
 * Uses singleton pattern to prevent multiple instances in development
 */
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (config.isDevelopment) {
  globalThis.prismaGlobal = prisma;

  // Log queries in development
  prisma.$on('query' as never, (e: any) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

/**
 * Connect to database
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

/**
 * Disconnect from database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    throw error;
  }
};

/**
 * Health check for database
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};
