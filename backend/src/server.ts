import app from './app';
import { config, logger, connectDatabase, disconnectDatabase, closeQueues } from './config';

/**
 * Server Port
 */
const PORT = config.port;

/**
 * Start Server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info(`🚀 MBBS Mentor Backend Server`);
      logger.info('='.repeat(50));
      logger.info(`📍 Server running on port: ${PORT}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API Base URL: http://localhost:${PORT}/api/v1`);
      logger.info('='.repeat(50));
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} signal received: closing HTTP server`);

      // Close server
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close BullMQ queues and workers
          await closeQueues();
          logger.info('Queues closed');

          // Disconnect from database
          await disconnectDatabase();
          logger.info('Database connection closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
