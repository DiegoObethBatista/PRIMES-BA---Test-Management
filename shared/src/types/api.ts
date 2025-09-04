/**
 * API request and response types
 */

import { TestCase, TestRun, TokenUsage } from './database';
import { 
  AzureDevOpsProject, 
  AzureDevOpsTestPlan, 
  AzureDevOpsTestSuite, 
  AzureDevOpsConnectionTest,
  AzureDevOpsImportRequest,
  AzureDevOpsImportResult
} from './azureDevOps';

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Test Cases API
export interface GetTestCasesQuery extends PaginationParams {
  area?: string;
  priority?: number;
}

export type GetTestCasesResponse = PaginatedResponse<TestCase>;

// Test Generation API
export interface GenerateTestRequest {
  regenerate?: boolean;
}

export interface GenerateTestResponse extends ApiResponse {
  data?: {
    artifactId: string;
    tokensUsed: number;
    costUsd: number;
  };
}

// Test Execution API
export interface ExecuteTestRequest {
  browser?: 'chromium' | 'firefox' | 'webkit';
  env?: string;
}

export interface ExecuteTestResponse extends ApiResponse {
  data?: {
    runId: string;
  };
}

// Test Run Status API
export interface GetTestRunResponse extends ApiResponse<TestRun> {
  artifacts?: Array<{
    id: string;
    kind: string;
    path: string;
    created_at: string;
  }>;
  tokenUsage?: TokenUsage[];
}

// Health Check API
export interface HealthCheckResponse extends ApiResponse {
  data?: {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version: string;
    database: 'connected' | 'disconnected';
    uptime: number;
  };
}

// Azure DevOps API Types
export interface AzureDevOpsConnectionRequest {
  orgUrl: string;
  project: string;
  pat: string;
}

export type AzureDevOpsConnectionResponse = ApiResponse<AzureDevOpsConnectionTest>;

export type AzureDevOpsProjectsResponse = ApiResponse<AzureDevOpsProject[]>;

export interface AzureDevOpsTestPlansQuery {
  projectId?: string;
  testPlanId?: number;
  search?: string;
  skip?: number;
  top?: number;
}

export interface AzureDevOpsTestPlansResult {
  testPlans: AzureDevOpsTestPlan[];
  totalCount: number;
  skip: number;
  top: number;
}

export type AzureDevOpsTestPlansResponse = ApiResponse<AzureDevOpsTestPlansResult>;

export interface AzureDevOpsTestSuitesQuery {
  projectId: string;
  testPlanId: number;
}

export type AzureDevOpsTestSuitesResponse = ApiResponse<AzureDevOpsTestSuite[]>;

export type AzureDevOpsImportResponse = ApiResponse<AzureDevOpsImportResult>;