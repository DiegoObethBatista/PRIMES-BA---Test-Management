/**
 * Azure DevOps API types and interfaces
 */

// Azure DevOps API Response Wrapper
export interface AzureDevOpsApiResponse<T> {
  count: number;
  value: T[];
}

// Azure DevOps Project
export interface AzureDevOpsProject {
  id: string;
  name: string;
  description?: string;
  url: string;
  state: 'wellFormed' | 'createPending' | 'deleting' | 'new' | 'all';
  visibility: 'private' | 'public';
  lastUpdateTime: string;
}

// Azure DevOps Test Plan
export interface AzureDevOpsTestPlan {
  id: number;
  name: string;
  description?: string;
  owner: {
    displayName: string;
    id: string;
  };
  state: 'Inactive' | 'Active';
  startDate?: string;
  endDate?: string;
  iteration?: string;
  buildDefinition?: {
    id: string;
    name: string;
  };
  url: string;
  _links: {
    self: { href: string };
  };
}

// Azure DevOps Test Suite
export interface AzureDevOpsTestSuite {
  id: number;
  name: string;
  url: string;
  project: {
    id: string;
    name: string;
  };
  plan: {
    id: string;
    name: string;
  };
  parent?: {
    id: string;
    name: string;
  };
  hasChildren: boolean;
  children?: AzureDevOpsTestSuite[];
  suiteType: 'StaticTestSuite' | 'DynamicTestSuite' | 'RequirementTestSuite';
  testCaseCount: number;
}

// Azure DevOps Test Case
export interface AzureDevOpsTestCase {
  id: number;
  workItemType: 'Test Case';
  url: string;
  fields: {
    'System.Id': number;
    'System.Title': string;
    'System.Description'?: string;
    'System.State': 'Design' | 'Ready' | 'Closed';
    'System.AreaPath'?: string;
    'Microsoft.VSTS.Common.Priority'?: number;
    'Microsoft.VSTS.TCM.Steps'?: string; // HTML format with test steps
    'System.CreatedDate': string;
    'System.ChangedDate': string;
    'System.Rev': number;
  };
  _links: {
    self: { href: string };
    workItemUpdates: { href: string };
    workItemRevisions: { href: string };
    workItemComments: { href: string };
    html: { href: string };
    workItemType: { href: string };
    fields: { href: string };
  };
}

// Azure DevOps Test Step (parsed from HTML)
export interface AzureDevOpsTestStep {
  id: string;
  action: string;
  expectedResult: string;
  sharedStepId?: string;
}

// Azure DevOps Connection Configuration
export interface AzureDevOpsConfig {
  orgUrl: string;
  project: string;
  pat: string;
}

// Azure DevOps Connection Test Result
export interface AzureDevOpsConnectionTest {
  success: boolean;
  organizationName?: string;
  projectName?: string;
  error?: string;
  permissions?: {
    canReadProjects: boolean;
    canReadTestPlans: boolean;
    canReadTestCases: boolean;
  };
}

// Azure DevOps Import Request
export interface AzureDevOpsImportRequest {
  projectId: string;
  testPlanId: number;
  testSuiteIds?: number[]; // If not provided, imports all suites
  updateExisting?: boolean; // Default: true
}

// Azure DevOps Import Progress
export interface AzureDevOpsImportProgress {
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalTestCases: number;
  processedTestCases: number;
  importedTestCases: number;
  updatedTestCases: number;
  skippedTestCases: number;
  failedTestCases: number;
  startedAt: string;
  completedAt?: string;
  errors: Array<{
    testCaseId: number;
    error: string;
  }>;
}

// Azure DevOps Import Result
export interface AzureDevOpsImportResult {
  success: boolean;
  progress: AzureDevOpsImportProgress;
  message?: string;
}

// Custom error types for Azure DevOps operations
export interface AzureDevOpsError {
  code: 'AuthenticationError' | 'NotFoundError' | 'RateLimitError' | 'NetworkError' | 'ValidationError' | 'PermissionError';
  message: string;
  statusCode?: number;
  details?: unknown;
}