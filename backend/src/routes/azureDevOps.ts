import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import type { 
  AzureDevOpsConnectionRequest,
  AzureDevOpsConnectionResponse,
  AzureDevOpsProjectsResponse,
  AzureDevOpsTestPlansResponse,
  AzureDevOpsTestSuitesResponse,
  AzureDevOpsImportRequest,
  AzureDevOpsImportResponse,
  Environment,
  TestCase,
  TestStep
} from '@primes-ba/shared';
import { DatabaseManager } from '../services/database';
import { AzureDevOpsService } from '../services/azureDevOps';
import { handleValidation } from '../middleware/validation';
import { logger } from '../utils/logger';

/**
 * Azure DevOps API routes
 */
export function createAzureDevOpsRouter(dbManager: DatabaseManager, environment: Environment): Router {
  const router = Router();
  const azureDevOpsService = new AzureDevOpsService(environment);

  // POST /api/azure-devops/test-connection - Test Azure DevOps connection
  router.post(
    '/test-connection',
    [
      body('orgUrl').isURL().withMessage('Organization URL must be a valid URL'),
      body('project').isString().notEmpty().withMessage('Project name is required'),
      body('pat').isString().notEmpty().withMessage('Personal Access Token is required'),
    ],
    handleValidation,
    async (req: Request, res: Response<AzureDevOpsConnectionResponse>) => {
      try {
        const { orgUrl, project, pat } = req.body as AzureDevOpsConnectionRequest;
        
        // Create temporary service instance for testing
        const tempEnvironment = { ...environment, ADO_ORG_URL: orgUrl, ADO_PROJECT: project, ADO_PAT: pat };
        const tempService = new AzureDevOpsService(tempEnvironment);
        
        const connectionTest = await tempService.testConnection();
        
        logger.info('Azure DevOps connection test completed', { 
          success: connectionTest.success,
          organizationName: connectionTest.organizationName,
          projectName: connectionTest.projectName 
        });

        res.json({
          success: true,
          data: connectionTest,
        });
      } catch (error) {
        logger.error('Azure DevOps connection test failed', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        
        throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // GET /api/azure-devops/projects - Get list of projects
  router.get(
    '/projects',
    async (req: Request, res: Response<AzureDevOpsProjectsResponse>) => {
      try {
        const projects = await azureDevOpsService.getProjects();
        
        logger.info('Retrieved Azure DevOps projects', { count: projects.length });

        res.json({
          success: true,
          data: projects,
        });
      } catch (error) {
        logger.error('Failed to retrieve Azure DevOps projects', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        
        throw new Error(`Failed to retrieve projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // GET /api/azure-devops/test-plans - Get test plans for a project
  router.get(
    '/test-plans',
    [
      query('projectId').isString().notEmpty().withMessage('Project ID is required'),
    ],
    handleValidation,
    async (req: Request, res: Response<AzureDevOpsTestPlansResponse>) => {
      try {
        const { projectId } = req.query as { projectId: string };
        
        const testPlans = await azureDevOpsService.getTestPlans(projectId);
        
        logger.info('Retrieved Azure DevOps test plans', { 
          projectId, 
          count: testPlans.length 
        });

        res.json({
          success: true,
          data: testPlans,
        });
      } catch (error) {
        logger.error('Failed to retrieve Azure DevOps test plans', { 
          projectId: req.query.projectId,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        
        throw new Error(`Failed to retrieve test plans: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // GET /api/azure-devops/test-suites - Get test suites for a test plan
  router.get(
    '/test-suites',
    [
      query('projectId').isString().notEmpty().withMessage('Project ID is required'),
      query('testPlanId').isInt({ min: 1 }).withMessage('Test Plan ID must be a positive integer'),
    ],
    handleValidation,
    async (req: Request, res: Response<AzureDevOpsTestSuitesResponse>) => {
      try {
        const { projectId, testPlanId } = req.query as { projectId: string; testPlanId: string };
        
        const testSuites = await azureDevOpsService.getTestSuites(projectId, parseInt(testPlanId));
        
        logger.info('Retrieved Azure DevOps test suites', { 
          projectId, 
          testPlanId, 
          count: testSuites.length 
        });

        res.json({
          success: true,
          data: testSuites,
        });
      } catch (error) {
        logger.error('Failed to retrieve Azure DevOps test suites', { 
          projectId: req.query.projectId,
          testPlanId: req.query.testPlanId,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        
        throw new Error(`Failed to retrieve test suites: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // POST /api/azure-devops/import - Import test cases from Azure DevOps
  router.post(
    '/import',
    [
      body('projectId').isString().notEmpty().withMessage('Project ID is required'),
      body('testPlanId').isInt({ min: 1 }).withMessage('Test Plan ID must be a positive integer'),
      body('testSuiteIds').optional().isArray().withMessage('Test Suite IDs must be an array'),
      body('testSuiteIds.*').optional().isInt({ min: 1 }).withMessage('Each Test Suite ID must be a positive integer'),
      body('updateExisting').optional().isBoolean().withMessage('Update existing must be a boolean'),
    ],
    handleValidation,
    async (req: Request, res: Response<AzureDevOpsImportResponse>) => {
      try {
        const importRequest = req.body as AzureDevOpsImportRequest;
        const { projectId, testPlanId, testSuiteIds, updateExisting = true } = importRequest;
        
        logger.info('Starting Azure DevOps import', { 
          projectId, 
          testPlanId, 
          testSuiteIds, 
          updateExisting 
        });

        // Get test suites to import
        const allSuites = await azureDevOpsService.getTestSuites(projectId, testPlanId);
        const suitesToImport = testSuiteIds 
          ? allSuites.filter(suite => testSuiteIds.includes(suite.id))
          : allSuites;

        // Initialize progress tracking
        let totalTestCases = 0;
        let processedTestCases = 0;
        let importedTestCases = 0;
        let updatedTestCases = 0;
        let skippedTestCases = 0;
        let failedTestCases = 0;
        const errors: Array<{ testCaseId: number; error: string }> = [];
        const startedAt = new Date().toISOString();

        // Calculate total test cases
        for (const suite of suitesToImport) {
          totalTestCases += suite.testCaseCount;
        }

        // Process each test suite
        const db = dbManager.getConnection();
        
        for (const suite of suitesToImport) {
          try {
            const testCases = await azureDevOpsService.getTestCases(projectId, testPlanId, suite.id);
            
            for (const testCase of testCases) {
              try {
                processedTestCases++;
                
                // Get detailed test case information
                const detailedTestCase = await azureDevOpsService.getTestCaseDetails(projectId, testCase.id);
                
                // Parse test steps
                const stepsHtml = detailedTestCase.fields['Microsoft.VSTS.TCM.Steps'] || '';
                const parsedSteps = azureDevOpsService.parseTestSteps(stepsHtml);
                
                // Check if test case already exists
                const existingTestCase = db.prepare('SELECT id FROM test_cases WHERE id = ?').get(testCase.id.toString()) as TestCase | undefined;
                
                if (existingTestCase && !updateExisting) {
                  skippedTestCases++;
                  continue;
                }
                
                // Prepare test case data
                const testCaseData: Omit<TestCase, 'id'> & { id: string } = {
                  id: testCase.id.toString(),
                  title: detailedTestCase.fields['System.Title'] || '',
                  area: detailedTestCase.fields['System.AreaPath'] || null,
                  priority: detailedTestCase.fields['Microsoft.VSTS.Common.Priority'] || null,
                  last_synced_at: new Date().toISOString(),
                  source_rev: detailedTestCase.fields['System.Rev']?.toString() || null,
                };
                
                // Insert or update test case
                if (existingTestCase) {
                  db.prepare(`
                    UPDATE test_cases 
                    SET title = ?, area = ?, priority = ?, last_synced_at = ?, source_rev = ?
                    WHERE id = ?
                  `).run(
                    testCaseData.title,
                    testCaseData.area,
                    testCaseData.priority,
                    testCaseData.last_synced_at,
                    testCaseData.source_rev,
                    testCaseData.id
                  );
                  
                  // Delete existing steps
                  db.prepare('DELETE FROM test_steps WHERE case_id = ?').run(testCaseData.id);
                  updatedTestCases++;
                } else {
                  db.prepare(`
                    INSERT INTO test_cases (id, title, area, priority, last_synced_at, source_rev)
                    VALUES (?, ?, ?, ?, ?, ?)
                  `).run(
                    testCaseData.id,
                    testCaseData.title,
                    testCaseData.area,
                    testCaseData.priority,
                    testCaseData.last_synced_at,
                    testCaseData.source_rev
                  );
                  importedTestCases++;
                }
                
                // Insert test steps
                for (let i = 0; i < parsedSteps.length; i++) {
                  const step = parsedSteps[i];
                  if (!step) continue; // Skip undefined steps
                  
                  const stepData: Omit<TestStep, 'id'> & { id: string } = {
                    id: `${testCaseData.id}-${i + 1}`,
                    case_id: testCaseData.id,
                    step_index: i + 1,
                    action: step.action,
                    expected: step.expectedResult || null,
                  };
                  
                  db.prepare(`
                    INSERT INTO test_steps (id, case_id, step_index, action, expected)
                    VALUES (?, ?, ?, ?, ?)
                  `).run(
                    stepData.id,
                    stepData.case_id,
                    stepData.step_index,
                    stepData.action,
                    stepData.expected
                  );
                }
                
              } catch (error) {
                failedTestCases++;
                errors.push({
                  testCaseId: testCase.id,
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
                logger.error('Failed to import test case', { 
                  testCaseId: testCase.id, 
                  error: error instanceof Error ? error.message : 'Unknown error' 
                });
              }
            }
          } catch (error) {
            logger.error('Failed to process test suite', { 
              suiteId: suite.id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }
        
        const completedAt = new Date().toISOString();
        
        const importResult = {
          success: errors.length === 0 || (importedTestCases + updatedTestCases) > 0,
          progress: {
            status: 'completed' as const,
            totalTestCases,
            processedTestCases,
            importedTestCases,
            updatedTestCases,
            skippedTestCases,
            failedTestCases,
            startedAt,
            completedAt,
            errors,
          },
          message: `Import completed: ${importedTestCases} imported, ${updatedTestCases} updated, ${skippedTestCases} skipped, ${failedTestCases} failed`,
        };
        
        logger.info('Azure DevOps import completed', importResult.progress);

        res.json({
          success: true,
          data: importResult,
        });
      } catch (error) {
        logger.error('Azure DevOps import failed', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        
        throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  return router;
}