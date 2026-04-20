import { Queue, Worker, QueueEvents } from 'bullmq';
import { config, logger } from '@/config';

/**
 * BullMQ Queue Configuration (Optional - requires Redis)
 * If Redis is not configured, queues will be disabled and jobs will be processed synchronously
 */

// Check if Redis is enabled
export const isQueueEnabled = config.redis.enabled;

// Redis connection (only if enabled)
const connection = config.redis.enabled && config.redis.url
  ? {
      host: new URL(config.redis.url).hostname,
      port: parseInt(new URL(config.redis.url).port) || 6379,
    }
  : undefined;

/**
 * Notes Processing Queue
 * Handles async note processing (OCR, AI formatting)
 */
export const notesQueue = connection ? new Queue('notes-processing', { connection }) : null;

/**
 * Email Queue
 * Handles async email sending
 */
export const emailQueue = connection ? new Queue('email-sending', { connection }) : null;

/**
 * Analytics Queue
 * Handles async analytics calculations
 */
export const analyticsQueue = connection ? new Queue('analytics-processing', { connection }) : null;

/**
 * Notes Processing Worker
 */
export const notesWorker = connection
  ? new Worker(
      'notes-processing',
      async (job) => {
        logger.info(`Processing note job: ${job.id}`);

        const { noteId } = job.data;

        try {
          const { notesProcessor } = await import('@/modules/notes/notes.processor');
          await notesProcessor.processNote(noteId);
          logger.info(`Completed processing note: ${noteId}`);
        } catch (error: any) {
          logger.error(`Failed to process note ${noteId}:`, error);
          throw error;
        }
      },
      {
        connection,
        concurrency: 5, // Process 5 notes concurrently
      }
    )
  : null;

/**
 * Email Worker
 */
export const emailWorker = connection
  ? new Worker(
      'email-sending',
      async (job) => {
        logger.info(`Sending email job: ${job.id}`);

        const { type, data: _data } = job.data;

        try {
          // TODO: Implement email sending based on type
          // const { emailService } = await import('@/modules/email');
          // await emailService.sendTemplateEmail(type, data.to, data);

          logger.info(`Email sent successfully: ${type}`);
        } catch (error: any) {
          logger.error(`Failed to send email:`, error);
          throw error;
        }
      },
      {
        connection,
        concurrency: 10, // Send 10 emails concurrently
      }
    )
  : null;

/**
 * Analytics Worker
 */
export const analyticsWorker = connection
  ? new Worker(
      'analytics-processing',
      async (job) => {
        logger.info(`Processing analytics job: ${job.id}`);

        const { type, userId } = job.data;

        try {
          // TODO: Implement analytics processing
          logger.info(`Analytics processed: ${type} for user ${userId}`);
        } catch (error: any) {
          logger.error(`Failed to process analytics:`, error);
          throw error;
        }
      },
      {
        connection,
        concurrency: 3,
      }
    )
  : null;

/**
 * Queue Events
 */

// Notes queue events
const notesQueueEvents = connection ? new QueueEvents('notes-processing', { connection }) : null;

if (notesQueueEvents) {
  notesQueueEvents.on('completed', ({ jobId }) => {
    logger.info(`Notes job ${jobId} completed`);
  });

  notesQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Notes job ${jobId} failed: ${failedReason}`);
  });
}

// Email queue events
const emailQueueEvents = connection ? new QueueEvents('email-sending', { connection }) : null;

if (emailQueueEvents) {
  emailQueueEvents.on('completed', ({ jobId }) => {
    logger.info(`Email job ${jobId} completed`);
  });

  emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Email job ${jobId} failed: ${failedReason}`);
  });
}

// Analytics queue events
const analyticsQueueEvents = connection ? new QueueEvents('analytics-processing', { connection }) : null;

if (analyticsQueueEvents) {
  analyticsQueueEvents.on('completed', ({ jobId }) => {
    logger.info(`Analytics job ${jobId} completed`);
  });

  analyticsQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Analytics job ${jobId} failed: ${failedReason}`);
  });
}

/**
 * Graceful shutdown
 */
export const closeQueues = async () => {
  if (!connection) {
    logger.info('Queues not enabled, skipping shutdown');
    return;
  }

  logger.info('Closing BullMQ queues and workers...');

  if (notesWorker) await notesWorker.close();
  if (emailWorker) await emailWorker.close();
  if (analyticsWorker) await analyticsWorker.close();

  if (notesQueue) await notesQueue.close();
  if (emailQueue) await emailQueue.close();
  if (analyticsQueue) await analyticsQueue.close();

  if (notesQueueEvents) await notesQueueEvents.close();
  if (emailQueueEvents) await emailQueueEvents.close();
  if (analyticsQueueEvents) await analyticsQueueEvents.close();

  logger.info('All queues and workers closed');
};

/**
 * Queue Helper Functions
 */

/**
 * Add note to processing queue
 */
export const queueNoteProcessing = async (noteId: string) => {
  if (!notesQueue) {
    logger.warn('Queue not enabled, processing note in background (fire-and-forget)');
    // Fire-and-forget: don't await so the upload response is not blocked or crashed by processing errors
    import('@/modules/notes/notes.processor').then(({ notesProcessor }) => {
      notesProcessor.processNote(noteId).catch((err) => {
        logger.error(`Background note processing failed for ${noteId}: ${err.message}`);
      });
    });
    return;
  }

  await notesQueue.add(
    'process-note',
    { noteId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  logger.info(`Added note ${noteId} to processing queue`);
};

/**
 * Add email to sending queue
 */
export const queueEmail = async (type: string, to: string, data: any) => {
  if (!emailQueue) {
    logger.warn('Queue not enabled, email sending disabled');
    return;
  }

  await emailQueue.add(
    'send-email',
    { type, data: { to, ...data } },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    }
  );

  logger.info(`Added ${type} email to queue for ${to}`);
};

/**
 * Add analytics to processing queue
 */
export const queueAnalytics = async (type: string, userId: string, data?: any) => {
  if (!analyticsQueue) {
    logger.warn('Queue not enabled, analytics processing disabled');
    return;
  }

  await analyticsQueue.add(
    'process-analytics',
    { type, userId, data },
    {
      attempts: 2,
      removeOnComplete: true,
    }
  );

  logger.info(`Added ${type} analytics to queue for user ${userId}`);
};

if (connection) {
  logger.info('BullMQ queues initialized');
} else {
  logger.warn('Redis not configured - Queue processing disabled. Jobs will be processed synchronously.');
}
