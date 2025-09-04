import React, { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  Text,
  makeStyles,
  shorthands,
  Card
} from '@fluentui/react-components';
import type { AzureDevOpsConnectionTest, AzureDevOpsImportResult } from '@primes-ba/shared';
import { AzureDevOpsConfigForm } from '../components/AzureDevOpsConfigForm';
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
  }
});

export const AzureDevOpsPage: React.FC = () => {
  const styles = useStyles();
  
  const [connectionTest, setConnectionTest] = useState<AzureDevOpsConnectionTest | null>(null);
  const [importResult, setImportResult] = useState<AzureDevOpsImportResult | null>(null);

  const handleConnectionSuccess = (result: AzureDevOpsConnectionTest) => {
    setConnectionTest(result);
  };

  const handleImportComplete = (result: AzureDevOpsImportResult) => {
    setImportResult(result);
  };

  const isConnected = connectionTest?.success === true;
  const hasImported = importResult?.success === true;

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.page}>
        <Card className={styles.header}>
          <Text size={700} weight="bold">
            Azure DevOps Integration
          </Text>
          <Text size={400}>
            Connect to Azure DevOps and import test cases from your test plans into the local database.
          </Text>
        </Card>

        <div className={styles.content}>
          {/* Step 1: Configuration */}
          <div>
            <div className={styles.stepIndicator}>
              <div className={`${styles.stepNumber} ${isConnected ? styles.stepComplete : ''}`}>
                1
              </div>
              <Text size={500} weight="semibold">
                Configure Azure DevOps Connection
              </Text>
            </div>
            
            <AzureDevOpsConfigForm 
              onConnectionSuccess={handleConnectionSuccess}
            />
          </div>

          {/* Step 2: Import Test Cases */}
          {isConnected && (
            <div>
              <div className={styles.stepIndicator}>
                <div className={`${styles.stepNumber} ${hasImported ? styles.stepComplete : ''}`}>
                  2
                </div>
                <Text size={500} weight="semibold">
                  Import Test Cases
                </Text>
              </div>
              
              <TestPlanImport
                projectId={connectionTest?.projectName || ''}
                projectName={connectionTest?.projectName || ''}
                onImportComplete={handleImportComplete}
              />
            </div>
          )}

          {/* Step 3: Summary */}
          {hasImported && (
            <div>
              <div className={styles.stepIndicator}>
                <div className={`${styles.stepNumber} ${styles.stepComplete}`}>
                  3
                </div>
                <Text size={500} weight="semibold">
                  Import Complete
                </Text>
              </div>
              
              <Card style={{ padding: '24px' }}>
                <Text size={400} weight="semibold">
                  Import Summary
                </Text>
                <br />
                <Text>
                  Successfully completed import from Azure DevOps. 
                  You can now view and manage your test cases in the Test Cases section.
                </Text>
                
                {importResult && (
                  <div style={{ marginTop: '16px' }}>
                    <Text size={300}>
                      • Total Test Cases: {importResult.progress.totalTestCases}
                      <br />
                      • Imported: {importResult.progress.importedTestCases}
                      <br />
                      • Updated: {importResult.progress.updatedTestCases}
                      <br />
                      • Skipped: {importResult.progress.skippedTestCases}
                      <br />
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