import fetch from 'node-fetch';
import type { 
  AzureDevOpsProject,
  AzureDevOpsTestPlan,
  AzureDevOpsTestSuite,
  AzureDevOpsTestCase,
  AzureDevOpsTestStep,
  AzureDevOpsConfig,
  AzureDevOpsConnectionTest,
  AzureDevOpsApiResponse,
  AzureDevOpsError,
  Environment
} from '@primes-ba/shared';
import { logger } from '../utils/logger';

/**
 * Azure DevOps API client service
 * Follows the exact pattern from copilot-instructions.md
 */
export class AzureDevOpsService {
  private config: AzureDevOpsConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(private environment: Environment) {
    this.config = {
      orgUrl: environment.ADO_ORG_URL,
      project: environment.ADO_PROJECT,
      pat: environment.ADO_PAT,
    };
    
    this.baseUrl = `${this.config.orgUrl}/_apis`;
    this.authHeader = `Basic ${Buffer.from(`:${this.config.pat}`).toString('base64')}`;
  }

  /**
   * Test connection to Azure DevOps
   */
  async testConnection(): Promise<AzureDevOpsConnectionTest> {
    try {
      // Test by fetching organization info and project details
      const [orgInfo, projectInfo] = await Promise.all([
        this.getOrganizationInfo(),
        this.getProjectInfo()
      ]);

      return {
        success: true,
        organizationName: orgInfo.name,
        projectName: projectInfo.name,
        permissions: {
          canReadProjects: true,
          canReadTestPlans: true,
          canReadTestCases: true,
        }
      };
    } catch (error) {
      logger.error('Azure DevOps connection test failed', { error: this.formatError(error) });
      return {
        success: false,
        error: this.formatError(error).message,
      };
    }
  }

  /**
   * Get list of projects
   */
  async getProjects(): Promise<AzureDevOpsProject[]> {
    try {
      const url = `${this.baseUrl}/projects?api-version=6.0`;
      const response = await this.makeRequest<AzureDevOpsApiResponse<AzureDevOpsProject>>(url);
      return response.value;
    } catch (error) {
      logger.error('Failed to fetch Azure DevOps projects', { error: this.formatError(error) });
      throw this.formatError(error);
    }
  }

  /**
   * Get test plans for a project
   */
  async getTestPlans(projectId: string): Promise<AzureDevOpsTestPlan[]> {
    try {
      const url = `${this.baseUrl}/testplan/plans?api-version=6.0`;
      const response = await this.makeRequest<AzureDevOpsApiResponse<AzureDevOpsTestPlan>>(url, projectId);
      return response.value;
    } catch (error) {
      logger.error('Failed to fetch Azure DevOps test plans', { 
        projectId, 
        error: this.formatError(error) 
      });
      throw this.formatError(error);
    }
  }

  /**
   * Get test suites for a test plan
   */
  async getTestSuites(projectId: string, testPlanId: number): Promise<AzureDevOpsTestSuite[]> {
    try {
      const url = `${this.baseUrl}/testplan/Plans/${testPlanId}/suites?api-version=6.0`;
      const response = await this.makeRequest<AzureDevOpsApiResponse<AzureDevOpsTestSuite>>(url, projectId);
      return response.value;
    } catch (error) {
      logger.error('Failed to fetch Azure DevOps test suites', { 
        projectId, 
        testPlanId, 
        error: this.formatError(error) 
      });
      throw this.formatError(error);
    }
  }

  /**
   * Get test cases from a test suite
   */
  async getTestCases(projectId: string, testPlanId: number, testSuiteId: number): Promise<AzureDevOpsTestCase[]> {
    try {
      const url = `${this.baseUrl}/testplan/Plans/${testPlanId}/Suites/${testSuiteId}/TestCase?api-version=6.0`;
      const response = await this.makeRequest<AzureDevOpsApiResponse<AzureDevOpsTestCase>>(url, projectId);
      return response.value;
    } catch (error) {
      logger.error('Failed to fetch Azure DevOps test cases', { 
        projectId, 
        testPlanId, 
        testSuiteId, 
        error: this.formatError(error) 
      });
      throw this.formatError(error);
    }
  }

  /**
   * Get test case details including steps
   */
  async getTestCaseDetails(projectId: string, testCaseId: number): Promise<AzureDevOpsTestCase> {
    try {
      const url = `${this.baseUrl}/wit/workitems/${testCaseId}?api-version=6.0&$expand=all`;
      const response = await this.makeRequest<AzureDevOpsTestCase>(url, projectId);
      return response;
    } catch (error) {
      logger.error('Failed to fetch Azure DevOps test case details', { 
        projectId, 
        testCaseId, 
        error: this.formatError(error) 
      });
      throw this.formatError(error);
    }
  }

  /**
   * Parse test steps from Azure DevOps HTML format
   */
  parseTestSteps(stepsHtml: string): AzureDevOpsTestStep[] {
    if (!stepsHtml) return [];

    try {
      // Simple HTML parsing for test steps
      // Azure DevOps stores steps in a specific table format
      const steps: AzureDevOpsTestStep[] = [];
      
      // Match step table rows - this is a simplified parser
      const stepMatches = stepsHtml.match(/<tr[^>]*>.*?<\/tr>/gs);
      
      if (stepMatches) {
        stepMatches.forEach((row, index) => {
          // Extract action and expected result from table cells
          const cellMatches = row.match(/<td[^>]*>(.*?)<\/td>/gs);
          
          if (cellMatches && cellMatches.length >= 2) {
            const action = this.stripHtml(cellMatches[0] || '');
            const expectedResult = this.stripHtml(cellMatches[1] || '');
            
            if (action.trim()) {
              steps.push({
                id: `${index + 1}`,
                action: action.trim(),
                expectedResult: expectedResult.trim(),
              });
            }
          }
        });
      }
      
      return steps;
    } catch (error) {
      logger.warn('Failed to parse test steps HTML', { error: this.formatError(error) });
      return [];
    }
  }

  /**
   * Make HTTP request to Azure DevOps API
   */
  private async makeRequest<T>(url: string, projectId?: string): Promise<T> {
    const headers = {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add project context if provided
    const finalUrl = projectId ? url.replace('/_apis/', `/${projectId}/_apis/`) : url;

    try {
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers,
        timeout: 30000, // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw this.createAzureDevOpsError(response.status, errorText);
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'FetchError') {
        throw this.createAzureDevOpsError(0, 'Network error connecting to Azure DevOps');
      }
      throw error;
    }
  }

  /**
   * Get organization information
   */
  private async getOrganizationInfo(): Promise<{ name: string }> {
    const url = `${this.config.orgUrl}/_apis/connectionData?api-version=7.0`;
    const response = await this.makeRequest<{ authenticatedUser: { displayName: string } }>(url);
    
    // Extract organization name from URL
    const orgName = this.config.orgUrl.split('/').pop() || 'Unknown';
    
    return { name: orgName };
  }

  /**
   * Get project information
   */
  private async getProjectInfo(): Promise<AzureDevOpsProject> {
    const url = `${this.baseUrl}/projects/${this.config.project}?api-version=7.0`;
    return await this.makeRequest<AzureDevOpsProject>(url);
  }

  /**
   * Create typed Azure DevOps error
   */
  private createAzureDevOpsError(statusCode: number, message: string): AzureDevOpsError {
    let code: AzureDevOpsError['code'];
    
    switch (statusCode) {
      case 401:
      case 403:
        code = 'AuthenticationError';
        break;
      case 404:
        code = 'NotFoundError';
        break;
      case 429:
        code = 'RateLimitError';
        break;
      case 0:
        code = 'NetworkError';
        break;
      default:
        code = 'ValidationError';
    }

    return {
      code,
      message: message || `Azure DevOps API error (${statusCode})`,
      statusCode,
    };
  }

  /**
   * Format error for logging and responses
   */
  private formatError(error: unknown): AzureDevOpsError {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return error as AzureDevOpsError;
    }
    
    if (error instanceof Error) {
      return {
        code: 'ValidationError',
        message: error.message,
      };
    }
    
    return {
      code: 'ValidationError',
      message: 'Unknown error occurred',
    };
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}