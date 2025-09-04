import React, { useState, useEffect } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Text,
  makeStyles,
  shorthands,
  Card,
  Button,
  MessageBar
} from '@fluentui/react-components';
import { ArrowLeft24Regular, Settings24Regular, CheckmarkCircle24Regular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import type { AzureDevOpsConnectionTest } from '@primes-ba/shared';

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
    ...shorthands.padding('24px'),
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    ...shorthands.padding('24px'),
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    marginBottom: '16px',
  },
  stepNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#005a9e',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  stepComplete: {
    backgroundColor: '#107c10',
  },
  stepInactive: {
    backgroundColor: '#a19f9d',
  },
  backButton: {
    marginBottom: '16px',
  },
  summaryStats: {
    marginTop: '16px',
  },
  configCard: {
    ...shorthands.padding('20px'),
  },
  buttonSpacing: {
    marginTop: '12px',
  },
  connectionCheck: {
    marginTop: '16px',
  }
});

export const AzureDevOpsPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  
  const [connectionTest, setConnectionTest] = useState<AzureDevOpsConnectionTest | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Check connection status on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/azure-devops/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success && result.data) {
        setConnectionTest(result.data);
      } else {
        setConnectionTest({ success: false, error: result.error || 'Connection failed' });
      }
    } catch (error) {
      setConnectionTest({ success: false, error: 'Failed to check connection' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const isConnected = connectionTest?.success === true;

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.page}>
        <Button
          className={styles.backButton}
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={handleBackToHome}
        >
          Back to Home
        </Button>
        
        <Card className={styles.header}>
          <Text size={700} weight="bold">
            Azure DevOps Integration
          </Text>
          <Text size={400}>
            Connect to Azure DevOps and import test cases from your test plans into the local database.
          </Text>
        </Card>

        <div className={styles.content}>
          {/* Step 1: Check Connection */}
          <div>
            <div className={styles.stepIndicator}>
              <div className={`${styles.stepNumber} ${isConnected ? styles.stepComplete : ''}`}>
                1
              </div>
              <Text size={500} weight="semibold">
                Azure DevOps Connection Status
              </Text>
            </div>
            
            <Card className={styles.configCard}>
              {!isConnected && (
                <MessageBar intent="warning">
                  Azure DevOps is not configured or connection failed. Please configure your connection in Settings.
                  <div className={styles.buttonSpacing}>
                    <Button 
                      appearance="primary" 
                      icon={<Settings24Regular />}
                      onClick={() => navigate('/settings')}
                    >
                      Go to Settings
                    </Button>
                  </div>
                </MessageBar>
              )}
              
              {isConnected && (
                <MessageBar intent="success" icon={<CheckmarkCircle24Regular />}>
                  Connected to Azure DevOps successfully! Ready to import test cases.
                </MessageBar>
              )}
              
              <div className={styles.connectionCheck}>
                <Button 
                  appearance="subtle"
                  onClick={checkConnection}
                  disabled={isChecking}
                >
                  {isChecking ? 'Checking Connection...' : 'Check Connection'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Step 2: Import Instructions */}
          {isConnected && (
            <div>
              <div className={styles.stepIndicator}>
                <div className={styles.stepNumber}>
                  2
                </div>
                <Text size={500} weight="semibold">
                  Test Case Import
                </Text>
              </div>
              
              <Card className={styles.configCard}>
                <MessageBar intent="info">
                  Connection is ready! Test case import functionality will be available in a future version.
                  For now, you can configure and test your Azure DevOps connection in Settings.
                </MessageBar>
              </Card>
            </div>
          )}
        </div>
      </div>
    </FluentProvider>
  );
};