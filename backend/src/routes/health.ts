import { Router, Request, Response } from 'express';
import type { HealthCheckResponse } from '@primes-ba/shared';
import { DatabaseManager } from '../services/database';

/**
 * Health check route
 */
export function createHealthRouter(dbManager: DatabaseManager): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const isDbConnected = dbManager.testConnection();
      const stats = isDbConnected ? dbManager.getStats() : null;
      
      const response: HealthCheckResponse = {
        success: true,
        data: {
          status: isDbConnected ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version ?? '1.0.0',
          database: isDbConnected ? 'connected' : 'disconnected',
          uptime: process.uptime(),
        },
      };

      // Add database stats if available
      if (stats) {
        response.data = {
          ...response.data,
          testCases: stats.testCases,
          testSteps: stats.testSteps,
          testRuns: stats.testRuns,
          tokenUsage: stats.tokenUsage,
        } as any; // TODO: Fix types for health response with stats
      }

      const statusCode = isDbConnected ? 200 : 503;
      res.status(statusCode).json(response);
    } catch (error) {
      const response: HealthCheckResponse = {
        success: false,
        error: 'HealthCheckError',
        message: 'Health check failed',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version ?? '1.0.0',
          database: 'disconnected',
          uptime: process.uptime(),
        },
      };

      res.status(503).json(response);
    }
  });

  return router;
}