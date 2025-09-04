import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import type { GetTestCasesResponse, TestCase } from '@primes-ba/shared';
import { DatabaseManager } from '../services/database';
import { handleValidation } from '../middleware/validation';

/**
 * Test cases API routes
 */
export function createTestCasesRouter(dbManager: DatabaseManager): Router {
  const router = Router();

  // GET /api/cases - List test cases with pagination
  router.get(
    '/',
    [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('area').optional().isString().withMessage('Area must be a string'),
      query('priority').optional().isInt({ min: 1, max: 4 }).withMessage('Priority must be between 1 and 4'),
    ],
    handleValidation,
    (req: Request, res: Response) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const area = req.query.area as string;
        const priority = req.query.priority ? parseInt(req.query.priority as string) : undefined;

        const offset = (page - 1) * limit;

        // Build query with filters
        let sql = 'SELECT * FROM test_cases WHERE 1=1';
        const params: unknown[] = [];

        if (area) {
          sql += ' AND area = ?';
          params.push(area);
        }

        if (priority !== undefined) {
          sql += ' AND priority = ?';
          params.push(priority);
        }

        sql += ' ORDER BY last_synced_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        // Get total count for pagination
        let countSql = 'SELECT COUNT(*) as total FROM test_cases WHERE 1=1';
        const countParams: unknown[] = [];

        if (area) {
          countSql += ' AND area = ?';
          countParams.push(area);
        }

        if (priority !== undefined) {
          countSql += ' AND priority = ?';
          countParams.push(priority);
        }

        const db = dbManager.getConnection();
        const testCases = db.prepare(sql).all(...params) as TestCase[];
        const totalResult = db.prepare(countSql).get(...countParams) as { total: number };
        const total = totalResult.total;
        const totalPages = Math.ceil(total / limit);

        const response: GetTestCasesResponse = {
          success: true,
          data: testCases,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        };

        res.json(response);
      } catch (error) {
        throw new Error(`Failed to fetch test cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  return router;
}