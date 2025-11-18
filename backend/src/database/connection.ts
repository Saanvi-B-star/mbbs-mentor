/**
 * Database Connection
 * Re-export prisma client from config for convenience
 */

export { prisma, connectDatabase, disconnectDatabase, checkDatabaseHealth } from '@/config/database';
