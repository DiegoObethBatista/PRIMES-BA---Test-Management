import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Button,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Checkbox,
  MessageBar,
  Spinner,
  ProgressBar,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  makeStyles,
  shorthands
} from '@fluentui/react-components';
import type { 
  AzureDevOpsTestPlan, 
  AzureDevOpsTestSuite, 
  AzureDevOpsImportRequest,
  AzureDevOpsImportResult 
} from '@primes-ba/shared';
import { apiClient } from '../services/api';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('24px'),
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  buttonContainer: {
    display: 'flex',
    ...shorthands.gap('12px'),
    alignItems: 'center',
  },
  dataGrid: {
    minHeight: '300px',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    ...shorthands.padding('16px'),
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('32px'),
    ...shorthands.gap('12px'),
  }
});

interface TestPlanImportProps {
  projectId: string;
  projectName: string;
  onImportComplete?: (result: AzureDevOpsImportResult) => void;
}

interface TestPlanWithSuites extends AzureDevOpsTestPlan {
  suites?: AzureDevOpsTestSuite[];
  selected?: boolean;
  selectedSuites?: Set<number>;
}

export const TestPlanImport: React.FC<TestPlanImportProps> = ({
  projectId,
  projectName,
  onImportComplete
}) => {
  const styles = useStyles();
  
  const [testPlans, setTestPlans] = useState<TestPlanWithSuites[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TestPlanWithSuites | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isLoadingSuites, setIsLoadingSuites] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<AzureDevOpsImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Load test plans on mount
  useEffect(() => {
    loadTestPlans();
  }, [projectId]);

  const loadTestPlans = async () => {
    setIsLoadingPlans(true);
    setError(null);
    
    try {
      const response = await apiClient.getAzureDevOpsTestPlans(projectId);
      
      if (response.success && response.data) {
        setTestPlans(response.data.map(plan => ({
          ...plan,
          selected: false,
          selectedSuites: new Set<number>(),
        })));
      } else {
        setError(response.error || 'Failed to load test plans');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const loadTestSuites = async (plan: TestPlanWithSuites) => {
    setIsLoadingSuites(true);
    setError(null);
    
    try {
      const response = await apiClient.getAzureDevOpsTestSuites(projectId, plan.id);
      
      if (response.success && response.data) {
        const updatedPlan = {
          ...plan,
          suites: response.data,
          selectedSuites: new Set(response.data.map(suite => suite.id)),
        };
        
        setSelectedPlan(updatedPlan);
        
        // Update test plans array
        setTestPlans(prev => 
          prev.map(p => p.id === plan.id ? updatedPlan : p)
        );
      } else {
        setError(response.error || 'Failed to load test suites');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setIsLoadingSuites(false);
    }
  };

  const handlePlanSelect = (plan: TestPlanWithSuites) => {
    if (plan.suites) {
      setSelectedPlan(plan);
    } else {
      loadTestSuites(plan);
    }
  };

  const handleSuiteToggle = (suiteId: number) => {
    if (!selectedPlan) return;
    
    const newSelectedSuites = new Set(selectedPlan.selectedSuites);
    if (newSelectedSuites.has(suiteId)) {
      newSelectedSuites.delete(suiteId);
    } else {
      newSelectedSuites.add(suiteId);
    }
    
    const updatedPlan = {
      ...selectedPlan,
      selectedSuites: newSelectedSuites,
    };
    
    setSelectedPlan(updatedPlan);
    setTestPlans(prev => 
      prev.map(p => p.id === selectedPlan.id ? updatedPlan : p)
    );
  };

  const startImport = async () => {
    if (!selectedPlan || selectedPlan.selectedSuites?.size === 0) {
      setError('Please select at least one test suite to import');
      return;
    }

    setIsImporting(true);
    setError(null);
    setShowImportDialog(false);

    const importRequest: AzureDevOpsImportRequest = {
      projectId,
      testPlanId: selectedPlan.id,
      testSuiteIds: Array.from(selectedPlan.selectedSuites || []),
      updateExisting: true,
    };

    try {
      const response = await apiClient.importFromAzureDevOps(importRequest);
      
      if (response.success && response.data) {
        setImportProgress(response.data);
        if (onImportComplete) {
          onImportComplete(response.data);
        }
      } else {
        setError(response.error || 'Import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setIsImporting(false);
    }
  };

  const testPlanColumns: TableColumnDefinition<TestPlanWithSuites>[] = [
    createTableColumn<TestPlanWithSuites>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Test Plan',
      renderCell: (plan) => (
        <div>
          <Text weight="semibold">{plan.name}</Text>
          {plan.description && (
            <Text size={200} style={{ display: 'block', marginTop: '4px' }}>
              {plan.description}
            </Text>
          )}
        </div>
      ),
    }),
    createTableColumn<TestPlanWithSuites>({
      columnId: 'owner',
      compare: (a, b) => a.owner.displayName.localeCompare(b.owner.displayName),
      renderHeaderCell: () => 'Owner',
      renderCell: (plan) => plan.owner.displayName,
    }),
    createTableColumn<TestPlanWithSuites>({
      columnId: 'state',
      compare: (a, b) => a.state.localeCompare(b.state),
      renderHeaderCell: () => 'State',
      renderCell: (plan) => plan.state,
    }),
    createTableColumn<TestPlanWithSuites>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (plan) => (
        <Button
          size="small"
          onClick={() => handlePlanSelect(plan)}
          disabled={isLoadingSuites}
        >
          {plan.suites ? 'View Suites' : 'Load Suites'}
        </Button>
      ),
    }),
  ];

  const suiteColumns: TableColumnDefinition<AzureDevOpsTestSuite>[] = [
    createTableColumn<AzureDevOpsTestSuite>({
      columnId: 'select',
      renderHeaderCell: () => 'Select',
      renderCell: (suite) => (
        <Checkbox
          checked={selectedPlan?.selectedSuites?.has(suite.id) || false}
          onChange={() => handleSuiteToggle(suite.id)}
        />
      ),
    }),
    createTableColumn<AzureDevOpsTestSuite>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Test Suite',
      renderCell: (suite) => suite.name,
    }),
    createTableColumn<AzureDevOpsTestSuite>({
      columnId: 'testCaseCount',
      compare: (a, b) => a.testCaseCount - b.testCaseCount,
      renderHeaderCell: () => 'Test Cases',
      renderCell: (suite) => suite.testCaseCount.toString(),
    }),
    createTableColumn<AzureDevOpsTestSuite>({
      columnId: 'suiteType',
      compare: (a, b) => a.suiteType.localeCompare(b.suiteType),
      renderHeaderCell: () => 'Type',
      renderCell: (suite) => suite.suiteType.replace('TestSuite', ''),
    }),
  ];

  const selectedSuitesCount = selectedPlan?.selectedSuites?.size || 0;
  const totalTestCases = selectedPlan?.suites
    ?.filter(suite => selectedPlan.selectedSuites?.has(suite.id))
    .reduce((sum, suite) => sum + suite.testCaseCount, 0) || 0;

  return (
    <Card className={styles.container}>
      <div className={styles.section}>
        <Text size={500} weight="semibold">
          Import Test Cases from {projectName}
        </Text>
        
        <Text size={300}>
          Select a test plan and test suites to import test cases into the local database.
        </Text>
      </div>

      {error && (
        <MessageBar intent="error">
          {error}
        </MessageBar>
      )}

      <div className={styles.section}>
        <Text size={400} weight="semibold">Test Plans</Text>
        
        {isLoadingPlans ? (
          <div className={styles.loadingContainer}>
            <Spinner size="medium" />
            <Text>Loading test plans...</Text>
          </div>
        ) : (
          <DataGrid
            items={testPlans}
            columns={testPlanColumns}
            sortable
            className={styles.dataGrid}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<TestPlanWithSuites>>
              {({ item, rowId }) => (
                <DataGridRow<TestPlanWithSuites> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        )}
      </div>

      {selectedPlan && (
        <div className={styles.section}>
          <Text size={400} weight="semibold">
            Test Suites - {selectedPlan.name}
          </Text>
          
          {isLoadingSuites ? (
            <div className={styles.loadingContainer}>
              <Spinner size="medium" />
              <Text>Loading test suites...</Text>
            </div>
          ) : selectedPlan.suites ? (
            <>
              <DataGrid
                items={selectedPlan.suites}
                columns={suiteColumns}
                sortable
                className={styles.dataGrid}
              >
                <DataGridHeader>
                  <DataGridRow>
                    {({ renderHeaderCell }) => (
                      <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                    )}
                  </DataGridRow>
                </DataGridHeader>
                <DataGridBody<AzureDevOpsTestSuite>>
                  {({ item, rowId }) => (
                    <DataGridRow<AzureDevOpsTestSuite> key={rowId}>
                      {({ renderCell }) => (
                        <DataGridCell>{renderCell(item)}</DataGridCell>
                      )}
                    </DataGridRow>
                  )}
                </DataGridBody>
              </DataGrid>

              <div className={styles.buttonContainer}>
                <Dialog>
                  <DialogTrigger disableButtonEnhancement>
                    <Button
                      appearance="primary"
                      disabled={selectedSuitesCount === 0 || isImporting}
                    >
                      Import Selected ({totalTestCases} test cases)
                    </Button>
                  </DialogTrigger>
                  <DialogSurface>
                    <DialogTitle>Confirm Import</DialogTitle>
                    <DialogContent>
                      <DialogBody>
                        <Text>
                          You are about to import {totalTestCases} test cases from {selectedSuitesCount} test suites.
                          Existing test cases will be updated with the latest information from Azure DevOps.
                        </Text>
                        <br />
                        <Text weight="semibold">
                          This operation may take several minutes to complete.
                        </Text>
                      </DialogBody>
                      <DialogActions>
                        <DialogTrigger disableButtonEnhancement>
                          <Button appearance="secondary">Cancel</Button>
                        </DialogTrigger>
                        <Button appearance="primary" onClick={startImport}>
                          Start Import
                        </Button>
                      </DialogActions>
                    </DialogContent>
                  </DialogSurface>
                </Dialog>
                
                <Text size={300}>
                  {selectedSuitesCount} suites selected, {totalTestCases} test cases
                </Text>
              </div>
            </>
          ) : null}
        </div>
      )}

      {isImporting && (
        <div className={styles.progressContainer}>
          <Text weight="semibold">Importing Test Cases...</Text>
          <Spinner size="medium" />
          <Text size={300}>Please wait while test cases are being imported...</Text>
        </div>
      )}

      {importProgress && (
        <div className={styles.progressContainer}>
          <Text weight="semibold">Import Complete</Text>
          <div className={styles.progressText}>
            <Text>Progress: {importProgress.progress.processedTestCases} / {importProgress.progress.totalTestCases}</Text>
            <Text>{Math.round((importProgress.progress.processedTestCases / importProgress.progress.totalTestCases) * 100)}%</Text>
          </div>
          <ProgressBar 
            value={importProgress.progress.processedTestCases} 
            max={importProgress.progress.totalTestCases} 
          />
          <div>
            <Text size={300}>
              ✅ Imported: {importProgress.progress.importedTestCases} | 
              🔄 Updated: {importProgress.progress.updatedTestCases} | 
              ⏭️ Skipped: {importProgress.progress.skippedTestCases} | 
              ❌ Failed: {importProgress.progress.failedTestCases}
            </Text>
          </div>
          {importProgress.message && (
            <MessageBar 
              intent={importProgress.success ? "success" : "error"}
            >
              {importProgress.message}
            </MessageBar>
          )}
        </div>
      )}
    </Card>
  );
};