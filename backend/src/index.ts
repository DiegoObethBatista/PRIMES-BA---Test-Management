import { validateEnvironment, redactEnvironment } from '@primes-ba/shared';
import { DatabaseManager } from './services/database';
import { startServer } from './app';
import { logger } from './utils/logger';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../.env.local' });

/**
 * Application entry point
 */
async function main(): Promise<void> {
  try {
    // Validate environment variables
    const config = validateEnvironment(process.env);
    
    // Log startup information (with redacted secrets)
    logger.info('Starting PRIMES BA Backend', {
      version: process.env.npm_package_version ?? '1.0.0',
      nodeVersion: process.version,
      environment: redactEnvironment(config),
    });

    // Initialize database
    const dbManager = new DatabaseManager(config);
    
    // Test database connection
    if (!dbManager.testConnection()) {
      throw new Error('Failed to connect to database');
    }
    
    const stats = dbManager.getStats();
    logger.info('Database initialized successfully', stats);

    // Start server
    startServer(config, dbManager);
    
  } catch (error) {
    logger.error('Failed to start application', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Start the application
main().catch((error) => {
  logger.error('Application startup failed:', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});