import { beforeAll, afterAll } from '@jest/globals';

// Set test environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.ADO_ORG_URL = 'https://dev.azure.com/test-org';
  process.env.ADO_PROJECT = 'test-project';
  process.env.ADO_PAT = 'test-pat-token-32-characters-long';
  process.env.OPENAI_API_KEY = 'test-openai-key-32-characters-long';
  process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
  process.env.PP_TENANT_ID = 'test-tenant-id';
  process.env.PP_ENV_URL = 'https://test.powerapps.com';
  process.env.AUTH_MODE = 'service';
  process.env.COST_CEILING_RUN_USD = '10.0';
  process.env.PORT = '3001';
  process.env.DB_PATH = ':memory:'; // Use in-memory database for tests
});

afterAll(() => {
  // Clean up if needed
});