import React, { useState, useEffect } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Text,
  makeStyles,
  shorthands,
  Card,
  Button,
  MessageBar,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Spinner,
} from '@fluentui/react-components';
import { ArrowLeft24Regular, Settings24Regular, CheckmarkCircle24Regular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import type { AzureDevOpsConnectionTest, AzureDevOpsImportResult, AzureDevOpsTestPlan } from '@primes-ba/shared';
import { TestPlanImport } from '../components/TestPlanImport';

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
  const [hasImported, setHasImported] = useState(false);
  const [importResult, setImportResult] = useState<AzureDevOpsImportResult | null>(null);
  const [testPlans, setTestPlans] = useState<AzureDevOpsTestPlan[]>([]);
  const [selectedTestPlan, setSelectedTestPlan] = useState<AzureDevOpsTestPlan | null>(null);
  const [isLoadingTestPlans, setIsLoadingTestPlans] = useState(false);

  // Check connection status on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // First try to get saved settings from localStorage or settings API
      const savedSettings = localStorage.getItem('azureDevOpsSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        // Test connection with saved settings
        const response = await fetch('/api/azure-devops/test-connection-with-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orgUrl: settings.adoOrgUrl,
            project: settings.adoProject,
            pat: settings.adoPat,
          }),
        });
        const result = await response.json();
        if (result.success && result.data) {
          setConnectionTest(result.data);
          // Load test plans when connection succeeds
          loadTestPlans();
        } else {
          setConnectionTest({ success: false, error: result.error || 'Connection failed' });
        }
      } else {
        // Fallback to environment settings
        const response = await fetch('/api/azure-devops/test-connection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();
        if (result.success && result.data) {
          setConnectionTest(result.data);
          // Load test plans when connection succeeds
          loadTestPlans();
        } else {
          setConnectionTest({ success: false, error: result.error || 'Connection failed' });
        }
      }
    } catch (error) {
      setConnectionTest({ success: false, error: 'Failed to check connection' });
    } finally {
      setIsChecking(false);
    }
  };

  const loadTestPlans = async () => {
    setIsLoadingTestPlans(true);
    try {
      const response = await fetch('/api/azure-devops/test-plans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success && result.data) {
        setTestPlans(result.data);
      } else {
        console.error('Failed to load test plans:', result.error);
        setTestPlans([]);
      }
    } catch (error) {
      console.error('Error loading test plans:', error);
      setTestPlans([]);
    } finally {
      setIsLoadingTestPlans(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleImportComplete = (result: AzureDevOpsImportResult) => {
    setImportResult(result);
    setHasImported(true);
  };

  const handleTestPlanSelect = (testPlan: AzureDevOpsTestPlan) => {
    setSelectedTestPlan(testPlan);
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

          {/* Step 2: Available Test Plans */}
          {isConnected && !selectedTestPlan && (
            <div>
              <div className={styles.stepIndicator}>
                <div className={styles.stepNumber}>
                  2
                </div>
                <Text size={500} weight="semibold">
                  Available Test Plans
                </Text>
              </div>
              
              <Card className={styles.configCard}>
                {isLoadingTestPlans ? (
                  <div className={styles.buttonSpacing}>
                    <Spinner size="small" />
                    <Text>Loading test plans...</Text>
                  </div>
                ) : testPlans.length > 0 ? (
                  <div>
                    <Text size={400} style={{ marginBottom: '16px' }}>
                      Select a test plan to import test cases from:
                    </Text>
                    <div className={styles.buttonSpacing}>
                      {testPlans.map((testPlan) => (
                        <Card 
                          key={testPlan.id} 
                          className={styles.buttonSpacing}
                          style={{ cursor: 'pointer', padding: '16px', marginBottom: '8px' }}
                          onClick={() => handleTestPlanSelect(testPlan)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Text size={500} weight="semibold">{testPlan.name}</Text>
                              <Text size={300}>ID: {testPlan.id} | State: {testPlan.state}</Text>
                            </div>
                            <Button appearance="primary" size="small">
                              Select
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <MessageBar intent="info">
                    No test plans found in this project. Create test plans in Azure DevOps first.
                  </MessageBar>
                )}
              </Card>
            </div>
          )}

          {/* Step 3: Import Selected Test Plan */}
          {isConnected && selectedTestPlan && !hasImported && (
            <div>
              <div className={styles.stepIndicator}>
                <div className={styles.stepNumber}>
                  3
                </div>
                <Text size={500} weight="semibold">
                  Import Test Plan: {selectedTestPlan.name}
                </Text>
              </div>
              
              <Card className={styles.configCard}>
                <div className={styles.buttonSpacing}>
                  <Button 
                    appearance="subtle" 
                    onClick={() => setSelectedTestPlan(null)}
                  >
                    ← Back to Test Plan Selection
                  </Button>
                </div>
                
                <TestPlanImport
                  projectId={connectionTest?.projectName || ''}
                  projectName={connectionTest?.projectName || ''}
                  onImportComplete={handleImportComplete}
                />
              </Card>
            </div>
          )}

          {/* Step 4: Import Summary */}
          {hasImported && (
            <div>
              <div className={styles.stepIndicator}>
                <div className={`${styles.stepNumber} ${styles.stepComplete}`}>
                  4
                </div>
                <Text size={500} weight="semibold">
                  Import Summary
                </Text>
              </div>
              
              <Card className={styles.configCard}>
                <Text size={600} weight="semibold">Import Completed Successfully</Text>
                {importResult && (
                  <div>
                    <Text size={400}>
                      • Total Test Cases: {importResult.progress.totalTestCases}
                    </Text>
                    <Text size={400}>
                      • Imported: {importResult.progress.importedTestCases}
                    </Text>
                    <Text size={400}>
                      • Updated: {importResult.progress.updatedTestCases}
                    </Text>
                    <Text size={400}>
                      • Skipped: {importResult.progress.skippedTestCases}
                    </Text>
                    <Text size={400}>
                      • Failed: {importResult.progress.failedTestCases}
                    </Text>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </FluentProvider>
  );
};