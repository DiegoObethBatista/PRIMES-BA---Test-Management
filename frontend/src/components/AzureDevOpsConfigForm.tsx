import React, { useState } from 'react';
import {
  Field,
  Input,
  Label,
  Button,
  Card,
  Text,
  MessageBar,
  Spinner,
  makeStyles,
  shorthands
} from '@fluentui/react-components';
import type { AzureDevOpsConnectionRequest, AzureDevOpsConnectionTest } from '@primes-ba/shared';
import { apiClient } from '../services/api';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('24px'),
    maxWidth: '500px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  buttonContainer: {
    display: 'flex',
    ...shorthands.gap('12px'),
    alignItems: 'center',
  },
  messageBar: {
    marginTop: '16px',
  },
  connectionResult: {
    marginTop: '16px',
    ...shorthands.padding('16px'),
    backgroundColor: '#f3f2f1',
    ...shorthands.borderRadius('4px'),
  }
});

interface AzureDevOpsConfigFormProps {
  onConnectionSuccess?: (connectionTest: AzureDevOpsConnectionTest) => void;
  initialConfig?: Partial<AzureDevOpsConnectionRequest>;
}

export const AzureDevOpsConfigForm: React.FC<AzureDevOpsConfigFormProps> = ({
  onConnectionSuccess,
  initialConfig = {}
}) => {
  const styles = useStyles();
  
  const [config, setConfig] = useState<AzureDevOpsConnectionRequest>({
    orgUrl: initialConfig.orgUrl || '',
    project: initialConfig.project || '',
    pat: initialConfig.pat || '',
  });
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<AzureDevOpsConnectionTest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof AzureDevOpsConnectionRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfig(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear previous results when config changes
    setConnectionResult(null);
    setError(null);
  };

  const validateConfig = (): string | null => {
    if (!config.orgUrl) return 'Organization URL is required';
    if (!config.project) return 'Project name is required';
    if (!config.pat) return 'Personal Access Token is required';
    
    try {
      new URL(config.orgUrl);
    } catch {
      return 'Invalid organization URL format';
    }
    
    if (!config.orgUrl.includes('dev.azure.com') && !config.orgUrl.includes('visualstudio.com')) {
      return 'Organization URL must be a valid Azure DevOps URL';
    }
    
    return null;
  };

  const handleTestConnection = async () => {
    const validationError = validateConfig();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsTestingConnection(true);
    setError(null);
    setConnectionResult(null);

    try {
      const response = await apiClient.testAzureDevOpsConnection(config);
      
      if (response.success && response.data) {
        setConnectionResult(response.data);
        if (response.data.success && onConnectionSuccess) {
          onConnectionSuccess(response.data);
        }
      } else {
        setError(response.error || 'Connection test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const isFormValid = config.orgUrl && config.project && config.pat;

  return (
    <Card className={styles.container}>
      <Text size={500} weight="semibold">
        Azure DevOps Configuration
      </Text>
      
      <Text size={300}>
        Configure your Azure DevOps connection to import test cases from your organization.
      </Text>

      <Field className={styles.field}>
        <Label required htmlFor="orgUrl">
          Organization URL
        </Label>
        <Input
          id="orgUrl"
          value={config.orgUrl}
          onChange={handleInputChange('orgUrl')}
          placeholder="https://dev.azure.com/your-organization"
          type="url"
        />
      </Field>

      <Field className={styles.field}>
        <Label required htmlFor="project">
          Project Name
        </Label>
        <Input
          id="project"
          value={config.project}
          onChange={handleInputChange('project')}
          placeholder="Your project name"
        />
      </Field>

      <Field className={styles.field}>
        <Label required htmlFor="pat">
          Personal Access Token
        </Label>
        <Input
          id="pat"
          value={config.pat}
          onChange={handleInputChange('pat')}
          placeholder="Your Azure DevOps PAT"
          type="password"
        />
        <Text size={200}>
          Requires 'Test Plans (Read)' and 'Work Items (Read)' permissions
        </Text>
      </Field>

      <div className={styles.buttonContainer}>
        <Button
          appearance="primary"
          onClick={handleTestConnection}
          disabled={!isFormValid || isTestingConnection}
        >
          {isTestingConnection ? <Spinner size="tiny" /> : null}
          Test Connection
        </Button>
      </div>

      {error && (
        <MessageBar intent="error" className={styles.messageBar}>
          {error}
        </MessageBar>
      )}

      {connectionResult && (
        <div className={styles.connectionResult}>
          {connectionResult.success ? (
            <MessageBar intent="success" className={styles.messageBar}>
              <Text weight="semibold">Connection Successful!</Text>
              <br />
              Organization: {connectionResult.organizationName}
              <br />
              Project: {connectionResult.projectName}
              <br />
              Permissions: {Object.entries(connectionResult.permissions || {})
                .filter(([, value]) => value)
                .map(([key]) => key.replace('can', '').replace(/([A-Z])/g, ' $1').trim())
                .join(', ')}
            </MessageBar>
          ) : (
            <MessageBar intent="error" className={styles.messageBar}>
              <Text weight="semibold">Connection Failed</Text>
              <br />
              {connectionResult.error}
            </MessageBar>
          )}
        </div>
      )}
    </Card>
  );
};