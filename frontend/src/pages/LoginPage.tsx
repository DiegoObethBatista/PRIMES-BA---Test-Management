import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardFooter,
  Text,
  Button,
  Input,
  Field,
  Body1,
  Caption1,
  makeStyles,
  tokens,
  MessageBar,
  Spinner,
} from '@fluentui/react-components';
import {
  PersonRegular,
  KeyRegular,
  BuildingRegular,
  FolderRegular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
  },
  loginCard: {
    width: '100%',
    maxWidth: '400px',
    padding: tokens.spacingVerticalXL,
  },
  header: {
    textAlign: 'center',
    marginBottom: tokens.spacingVerticalXL,
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalS,
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  fieldIcon: {
    fontSize: '16px',
    color: tokens.colorNeutralForeground2,
  },
  loginButton: {
    marginTop: tokens.spacingVerticalM,
  },
  footer: {
    textAlign: 'center',
    marginTop: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
});

interface LoginFormData {
  organizationUrl: string;
  projectName: string;
  personalAccessToken: string;
}

export function LoginPage(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<LoginFormData>({
    organizationUrl: 'https://dev.azure.com/PRIMES-DevOps',
    projectName: 'PRIMES - BA Team',
    personalAccessToken: '',
  });

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const validateForm = (): boolean => {
    if (!formData.organizationUrl.trim()) {
      setError('Organization URL is required');
      return false;
    }
    if (!formData.projectName.trim()) {
      setError('Project Name is required');
      return false;
    }
    if (!formData.personalAccessToken.trim()) {
      setError('Personal Access Token is required');
      return false;
    }
    if (!formData.organizationUrl.includes('dev.azure.com')) {
      setError('Please enter a valid Azure DevOps URL');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      // Test Azure DevOps connection
      const response = await fetch('/api/azure-devops/test-connection-with-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgUrl: formData.organizationUrl,
          project: formData.projectName,
          pat: formData.personalAccessToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Map project name to project ID
        const getProjectId = (projectName: string): string => {
          // Known mappings
          const projectMappings: Record<string, string> = {
            'PRIMES - BA Team': 'primes-amp',
            'primes-amp': 'primes-amp'
          };
          return projectMappings[projectName] || projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        };

        // Use auth context to login
        login({
          organizationUrl: formData.organizationUrl,
          projectName: formData.projectName,
          projectId: getProjectId(formData.projectName),
          personalAccessToken: formData.personalAccessToken,
          isAuthenticated: true,
          authenticatedAt: new Date().toISOString(),
        });

        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError(result.error || 'Failed to connect to Azure DevOps. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.loginCard}>
        <CardHeader>
          <div className={styles.header}>
            <Text className={styles.title}>PRIMES BA Test Management</Text>
            <Caption1 className={styles.subtitle}>
              Sign in to your Azure DevOps organization
            </Caption1>
          </div>
        </CardHeader>

        <div className={styles.form}>
          {error && (
            <MessageBar intent="error">
              {error}
            </MessageBar>
          )}

          <Field
            label="Organization URL"
            required
            validationMessage={!formData.organizationUrl.trim() ? "Organization URL is required" : ""}
            validationState={!formData.organizationUrl.trim() ? "error" : "none"}
          >
            <Input
              contentBefore={<BuildingRegular className={styles.fieldIcon} />}
              placeholder="https://dev.azure.com/your-organization"
              value={formData.organizationUrl}
              onChange={(_, data) => handleInputChange('organizationUrl', data.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </Field>

          <Field
            label="Project Name"
            required
            validationMessage={!formData.projectName.trim() ? "Project Name is required" : ""}
            validationState={!formData.projectName.trim() ? "error" : "none"}
          >
            <Input
              contentBefore={<FolderRegular className={styles.fieldIcon} />}
              placeholder="Your Project Name"
              value={formData.projectName}
              onChange={(_, data) => handleInputChange('projectName', data.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </Field>

          <Field
            label="Personal Access Token"
            required
            validationMessage={!formData.personalAccessToken.trim() ? "Personal Access Token is required" : ""}
            validationState={!formData.personalAccessToken.trim() ? "error" : "none"}
          >
            <Input
              contentBefore={<KeyRegular className={styles.fieldIcon} />}
              placeholder="Enter your Azure DevOps PAT"
              type="password"
              value={formData.personalAccessToken}
              onChange={(_, data) => handleInputChange('personalAccessToken', data.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </Field>
        </div>

        <CardFooter>
          <Button
            appearance="primary"
            size="large"
            className={styles.loginButton}
            onClick={handleLogin}
            disabled={isLoading || !formData.organizationUrl.trim() || !formData.projectName.trim() || !formData.personalAccessToken.trim()}
            icon={isLoading ? <Spinner size="tiny" /> : <PersonRegular />}
            style={{ width: '100%' }}
          >
            {isLoading ? 'Connecting...' : 'Sign In to Azure DevOps'}
          </Button>
        </CardFooter>
      </Card>

      <div className={styles.footer}>
        <Caption1>
          Secure authentication powered by Azure DevOps REST API
        </Caption1>
      </div>
    </div>
  );
}
