import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Environment } from '@primes-ba/shared';
import { DatabaseManager } from './services/database';
import { requestIdMiddleware, loggingMiddleware } from './middleware/logging';
import { errorHandler, notFoundHandler } from './middleware/error';
import { createHealthRouter } from './routes/health';
import { createTestCasesRouter } from './routes/testCases';
import { createTestsRouter } from './routes/tests';
import { createAzureDevOpsRouter } from './routes/azureDevOps';
import { logger } from './utils/logger';

/**
 * Create Express application with all middleware and routes
 */
export function createApp(config: Environment, dbManager: DatabaseManager): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // Rate limiting - max 100 requests per 15 minutes per IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'TooManyRequestsError',
      message: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // CORS configuration
  app.use(cors({
    origin: config.NODE_ENV === 'development' 
      ? ['http://localhost:3000', 'http://127.0.0.1:3000']
      : false, // TODO: Configure for production
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request middleware
  app.use(requestIdMiddleware);
  app.use(loggingMiddleware);

  // API Routes
  app.use('/api', createHealthRouter(dbManager));
  app.use('/api/cases', createTestCasesRouter(dbManager));
  app.use('/api/tests', createTestsRouter(dbManager));
  app.use('/api/azure-devops', createAzureDevOpsRouter(dbManager, config));

  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
export function startServer(config: Environment, dbManager: DatabaseManager): void {
  const app = createApp(config, dbManager);
  
  const server = app.listen(config.PORT, () => {
    logger.info(`Server started on port ${config.PORT}`, {
      port: config.PORT,
      environment: config.NODE_ENV,
      nodeVersion: process.version,
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      dbManager.close();
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      dbManager.close();
      process.exit(0);
    });
  });
}