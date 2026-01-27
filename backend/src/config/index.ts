/**
 * Central configuration exports
 * All configuration modules are exported from here for easy imports
 */

export { config, Config } from './environment';
export { logger, stream } from './logger';
export { prisma, connectDatabase, disconnectDatabase, checkDatabaseHealth } from './database';
export { s3Client, sesClient, textractClient, awsConfig } from './aws.config';
export { openRouterConfig, OpenRouterConfig } from './openrouter.config';
export { razorpayConfig, RazorpayConfig } from './razorpay.config';
export { passport } from './passport';
export {
  notesQueue,
  emailQueue,
  analyticsQueue,
  queueNoteProcessing,
  queueEmail,
  queueAnalytics,
  closeQueues,
} from './queue.config';
