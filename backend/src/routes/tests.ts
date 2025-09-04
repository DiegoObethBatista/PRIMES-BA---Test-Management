import { Router, Request, Response } from 'express';
import { param, body } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import type { 
  GenerateTestRequest, 
  GenerateTestResponse, 
  ExecuteTestRequest, 
  ExecuteTestResponse,
  GetTestRunResponse,
  TestRun,
  TokenUsage 
} from '@primes-ba/shared';
import { DatabaseManager } from '../services/database';
import { handleValidation } from '../middleware/validation';

/**
 * Test generation and execution routes
 */
export function createTestsRouter(dbManager: DatabaseManager): Router {
  const router = Router();

  // POST /api/generate/:id - Generate Playwright test for a test case
  router.post(
    '/generate/:id',
    [
      param('id').isString().notEmpty().withMessage('Test case ID is required'),
      body('regenerate').optional().isBoolean().withMessage('Regenerate must be a boolean'),
    ],
    handleValidation,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const caseId = req.params.id;
        const { regenerate = false }: GenerateTestRequest = req.body;

        const db = dbManager.getConnection();
        
        // Check if test case exists
        const testCase = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(caseId);
        if (!testCase) {
          res.status(404).json({
            success: false,
            error: 'NotFound',
            message: 'Test case not found',
          });
          return;
        }

        // TODO: Implement actual test generation with OpenAI
        // For now, create a placeholder artifact
        const artifactId = uuidv4();
        const now = new Date().toISOString();
        
        db.prepare(`
          INSERT INTO test_artifacts (id, case_id, kind, path, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(artifactId, caseId, 'playwright', `/e2e/tests/${caseId}.spec.ts`, now);

        const response: GenerateTestResponse = {
          success: true,
          data: {
            artifactId,
            tokensUsed: 0, // TODO: Track actual tokens used
            costUsd: 0.0, // TODO: Calculate actual cost
          },
        };

        res.json(response);
      } catch (error) {
        throw new Error(`Failed to generate test: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // POST /api/runs/:id/execute - Execute a test case
  router.post(
    '/runs/:id/execute',
    [
      param('id').isString().notEmpty().withMessage('Test case ID is required'),
      body('browser').optional().isIn(['chromium', 'firefox', 'webkit']).withMessage('Invalid browser'),
      body('env').optional().isString().withMessage('Environment must be a string'),
    ],
    handleValidation,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const caseId = req.params.id;
        const { browser = 'chromium', env = 'dev' }: ExecuteTestRequest = req.body;

        const db = dbManager.getConnection();
        
        // Check if test case exists
        const testCase = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(caseId);
        if (!testCase) {
          res.status(404).json({
            success: false,
            error: 'NotFound',
            message: 'Test case not found',
          });
          return;
        }

        // Create test run
        const runId = uuidv4();
        const now = new Date().toISOString();
        
        db.prepare(`
          INSERT INTO test_runs (id, case_id, started_at, status, browser, env)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(runId, caseId, now, 'running', browser, env);

        // TODO: Implement actual test execution with Playwright

        const response: ExecuteTestResponse = {
          success: true,
          data: {
            runId,
          },
        };

        res.json(response);
      } catch (error) {
        throw new Error(`Failed to execute test: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // GET /api/runs/:id - Get test run status and results
  router.get(
    '/runs/:id',
    [
      param('id').isString().notEmpty().withMessage('Run ID is required'),
    ],
    handleValidation,
    (req: Request, res: Response): void => {
      try {
        const runId = req.params.id;
        const db = dbManager.getConnection();
        
        // Get test run
        const testRun = db.prepare('SELECT * FROM test_runs WHERE id = ?').get(runId) as TestRun | undefined;
        if (!testRun) {
          res.status(404).json({
            success: false,
            error: 'NotFound',
            message: 'Test run not found',
          });
          return;
        }

        // Get artifacts for the test case
        const artifacts = db.prepare(`
          SELECT id, kind, path, created_at 
          FROM test_artifacts 
          WHERE case_id = ?
          ORDER BY created_at DESC
        `).all(testRun.case_id) as Array<{
          id: string;
          kind: string;
          path: string;
          created_at: string;
        }>;

        // Get token usage for this run
        const tokenUsage = db.prepare(`
          SELECT * FROM token_usage WHERE run_id = ?
        `).all(runId) as TokenUsage[];

        const response: GetTestRunResponse = {
          success: true,
          data: testRun,
          artifacts,
          tokenUsage,
        };

        res.json(response);
      } catch (error) {
        throw new Error(`Failed to fetch test run: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  return router;
}