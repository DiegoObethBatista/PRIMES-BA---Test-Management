import { AzureDevOpsService } from '../services/azureDevOps';
import type { Environment } from '@primes-ba/shared';

describe('AzureDevOpsService', () => {
  const mockEnvironment: Environment = {
    ADO_ORG_URL: 'https://dev.azure.com/test-org',
    ADO_PROJECT: 'test-project',
    ADO_PAT: 'test-pat',
    OPENAI_API_KEY: 'test-key',
    OPENAI_MODEL: 'gpt-3.5-turbo',
    PP_TENANT_ID: 'test-tenant',
    PP_ENV_URL: 'https://test.powerapps.com',
    AUTH_MODE: 'service' as const,
    COST_CEILING_RUN_USD: 10.0,
    PORT: 3001,
    NODE_ENV: 'test',
    DB_PATH: './test.db',
  };

  let service: AzureDevOpsService;

  beforeEach(() => {
    service = new AzureDevOpsService(mockEnvironment);
  });

  describe('parseTestSteps', () => {
    it('should parse empty HTML', () => {
      const result = service.parseTestSteps('');
      expect(result).toEqual([]);
    });

    it('should parse simple test steps HTML', () => {
      const html = `
        <table>
          <tr>
            <td>Click login button</td>
            <td>User should be redirected to login page</td>
          </tr>
          <tr>
            <td>Enter credentials</td>
            <td>Credentials should be accepted</td>
          </tr>
        </table>
      `;
      
      const result = service.parseTestSteps(html);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        action: 'Click login button',
        expectedResult: 'User should be redirected to login page',
      });
      expect(result[1]).toEqual({
        id: '2',
        action: 'Enter credentials',
        expectedResult: 'Credentials should be accepted',
      });
    });

    it('should handle HTML with tags and entities', () => {
      const html = `
        <table>
          <tr>
            <td><strong>Click</strong> &amp; verify</td>
            <td>Should work &lt;properly&gt;</td>
          </tr>
        </table>
      `;
      
      const result = service.parseTestSteps(html);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        action: 'Click & verify',
        expectedResult: 'Should work <properly>',
      });
    });
  });

  describe('configuration', () => {
    it('should initialize with correct configuration', () => {
      expect(service).toBeDefined();
      // The service should be properly configured with the mock environment
      // This test verifies the constructor works without throwing
    });
  });
});