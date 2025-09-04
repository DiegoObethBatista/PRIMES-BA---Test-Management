import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { mkdirSync } from 'fs';
import type { Environment } from '@primes-ba/shared';

/**
 * Database schema based on copilot instructions
 */
const SCHEMA_SQL = `
-- Test Cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id TEXT PRIMARY KEY,                -- Azure DevOps test case id
  title TEXT NOT NULL,
  area TEXT,
  priority INTEGER,
  last_synced_at TEXT NOT NULL,       -- ISO string
  source_rev TEXT                     -- ETag or revision from ADO
);

-- Test Steps table
CREATE TABLE IF NOT EXISTS test_steps (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  action TEXT NOT NULL,
  expected TEXT
);

-- Test Artifacts table
CREATE TABLE IF NOT EXISTS test_artifacts (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                 -- "playwright", "prompt", "analysis"
  path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Test Runs table
CREATE TABLE IF NOT EXISTS test_runs (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES test_cases(id),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,               -- "passed", "failed", "skipped", "error", "running"
  browser TEXT NOT NULL,              -- "chromium", "firefox", "webkit"
  env TEXT NOT NULL                   -- "dev", "test", "prod"
);

-- Token Usage table
CREATE TABLE IF NOT EXISTS token_usage (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES test_runs(id),
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  created_at TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_usage_run ON token_usage(run_id);
CREATE INDEX IF NOT EXISTS idx_test_steps_case ON test_steps(case_id);
CREATE INDEX IF NOT EXISTS idx_test_artifacts_case ON test_artifacts(case_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_case ON test_runs(case_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);
`;

export class DatabaseManager {
  private db: Database.Database;

  constructor(private config: Environment) {
    // Ensure database directory exists
    const dbDir = dirname(config.DB_PATH);
    mkdirSync(dbDir, { recursive: true });

    // Initialize database connection
    this.db = new Database(config.DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    this.initializeSchema();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    try {
      this.db.exec(SCHEMA_SQL);
    } catch (error) {
      throw new Error(`Failed to initialize database schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get database connection
   */
  getConnection(): Database.Database {
    return this.db;
  }

  /**
   * Test database connection
   */
  testConnection(): boolean {
    try {
      const result = this.db.prepare('SELECT 1 as test').get() as { test: number } | undefined;
      return result?.test === 1;
    } catch {
      return false;
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get database statistics
   */
  getStats(): { 
    testCases: number; 
    testSteps: number; 
    testRuns: number; 
    tokenUsage: number; 
  } {
    const testCases = this.db.prepare('SELECT COUNT(*) as count FROM test_cases').get() as { count: number };
    const testSteps = this.db.prepare('SELECT COUNT(*) as count FROM test_steps').get() as { count: number };
    const testRuns = this.db.prepare('SELECT COUNT(*) as count FROM test_runs').get() as { count: number };
    const tokenUsage = this.db.prepare('SELECT COUNT(*) as count FROM token_usage').get() as { count: number };

    return {
      testCases: testCases.count,
      testSteps: testSteps.count,
      testRuns: testRuns.count,
      tokenUsage: tokenUsage.count,
    };
  }
}