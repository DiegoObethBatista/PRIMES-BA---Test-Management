/**
 * Database entity types based on the SQLite schema
 */

export interface TestCase {
  id: string; // Azure DevOps test case id
  title: string;
  area: string | null;
  priority: number | null;
  last_synced_at: string; // ISO string
  source_rev: string | null; // ETag or revision from ADO
}

export interface TestStep {
  id: string;
  case_id: string;
  step_index: number;
  action: string;
  expected: string | null;
}

export interface TestArtifact {
  id: string;
  case_id: string;
  kind: 'playwright' | 'prompt' | 'analysis';
  path: string;
  created_at: string;
}

export interface TestRun {
  id: string;
  case_id: string;
  started_at: string;
  finished_at: string | null;
  status: 'passed' | 'failed' | 'skipped' | 'error' | 'running';
  browser: 'chromium' | 'firefox' | 'webkit';
  env: string; // 'dev', 'test', 'prod'
}

export interface TokenUsage {
  id: string;
  run_id: string | null;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  created_at: string;
}