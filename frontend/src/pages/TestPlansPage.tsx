import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardFooter,
  Text,
  Button,
  Input,
  Field,
  makeStyles,
  tokens,
  MessageBar,
  Spinner,
  Badge,
  Body1,
  Caption1,
  SearchBox,
  Divider,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
} from '@fluentui/react-components';
import {
  SearchRegular,
  DocumentRegular,
  ArrowDownloadRegular,
  ArrowClockwiseRegular,
  FilterRegular,
  PersonRegular,
  CalendarRegular,
  InfoRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  FolderRegular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { AzureDevOpsTestPlan, AzureDevOpsTestSuite, AzureDevOpsTestCase } from '@primes-ba/shared';
import { TestPlanTreeView } from '../components/TestPlanTreeView';
import { AppNavigation } from '../components/AppNavigation';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  main: {
    flex: 1,
    padding: tokens.spacingVerticalL,
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  searchSection: {
    marginBottom: tokens.spacingVerticalL,
  },
  searchBar: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  searchInput: {
    flex: 1,
  },
  filtersSection: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  resultsSection: {
    marginBottom: tokens.spacingVerticalL,
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  testPlanGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  testPlanCard: {
    padding: tokens.spacingVerticalM,
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  testPlanHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingVerticalS,
  },
  testPlanTitleSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: tokens.spacingVerticalXS,
    flex: 1,
  },
  testPlanTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.2',
  },
  testPlanMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalS,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground2,
    fontSize: '12px',
  },
  testPlanDescription: {
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalM,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  testPlanActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
  },
  emptyIcon: {
    fontSize: '48px',
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalM,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalXXL,
  },
  dialogContent: {
    display: 'flex',
    height: '100%',
    gap: tokens.spacingHorizontalM,
  },
  dialogColumn: {
    flex: 1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingRight: tokens.spacingHorizontalM,
  },
  dialogColumnLast: {
    flex: 1,
  },
  dialogColumnTitle: {
    marginBottom: tokens.spacingVerticalM,
  },
  dialogColumnContent: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    minHeight: '400px',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  paginationInfo: {
    color: tokens.colorNeutralForeground2,
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  pageNumber: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    minWidth: '32px',
    textAlign: 'center',
  },
});

// Pagination interface
interface PaginationState {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  totalPages: number;
}

export function TestPlansPage(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const { config } = useAuth();
  
  const [testPlans, setTestPlans] = useState<AzureDevOpsTestPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchById, setSearchById] = useState('');
  const [filteredTestPlans, setFilteredTestPlans] = useState<AzureDevOpsTestPlan[]>([]);
  const [selectedTestPlan, setSelectedTestPlan] = useState<AzureDevOpsTestPlan | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedSuites, setSelectedSuites] = useState<Set<number>>(new Set());
  const [selectedTestCases, setSelectedTestCases] = useState<Set<number>>(new Set());
  const [currentSelectedSuite, setCurrentSelectedSuite] = useState<AzureDevOpsTestSuite | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalCount: 0,
    pageSize: 10, // Show last 10 by default
    totalPages: 0,
  });

  useEffect(() => {
    // Config is guaranteed to exist due to ProtectedRoute
    if (!config) {
      navigate('/login');
      return;
    }

    // Load test plans on component mount
    loadTestPlans();
  }, [navigate, config]);

  useEffect(() => {
    // Filter test plans based on search query should trigger server reload
    // Instead of filtering client-side, we'll reload from server with search
    if (searchQuery.trim()) {
      loadTestPlans(1, searchQuery); // Reset to page 1 when searching
    } else {
      // If no search query, just set filtered plans to current plans
      setFilteredTestPlans(testPlans);
    }
  }, [searchQuery]); // Remove testPlans dependency to avoid infinite loop

  const loadTestPlans = async (page: number = 1, search?: string, testPlanId?: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      if (!config) {
        throw new Error('Authentication configuration not found');
      }

      const skip = (page - 1) * pagination.pageSize;
      const options: any = {
        skip,
        top: pagination.pageSize,
      };

      if (testPlanId) {
        options.testPlanId = parseInt(testPlanId);
      } else if (search) {
        options.search = search;
      }

      const response = await fetch('/api/azure-devops/test-plans?' + new URLSearchParams({
        projectId: config?.projectId || 'primes-amp', // Use projectId from config with fallback
        ...Object.fromEntries(Object.entries(options).map(([key, value]) => [key, String(value)]))
      }));
      
      if (!response.ok) {
        throw new Error('Failed to load test plans');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const actualTestPlans = data.data.testPlans;
        
        // Debug: Log the actual test plans data
        console.log('API Response:', data);
        console.log('Actual test plans from API:', actualTestPlans);
        console.log('Test plans length:', actualTestPlans.length);
        if (actualTestPlans.length > 0) {
          console.log('First test plan from API:', actualTestPlans[0]);
          console.log('First test plan name:', actualTestPlans[0]?.name);
        }
        
        // If no real test plans, provide mock data for demonstration
        const testPlansToUse = actualTestPlans.length > 0 ? actualTestPlans : [
          {
            id: 1,
            name: 'Demo Test Plan - E-commerce Application',
            description: 'Comprehensive testing for online shopping features',
            state: 'Active',
            areaPath: 'MyProject\\E-commerce\\Frontend',
            iteration: 'MyProject\\Sprint 1',
            owner: { displayName: 'Test Manager', id: 'test-manager-1' },
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://demo.com/testplan/1',
            _links: { self: { href: 'https://demo.com/testplan/1' } },
          },
          {
            id: 2,
            name: 'Demo Test Plan - User Authentication',
            description: 'Security and authentication testing suite',
            state: 'Active',
            areaPath: 'MyProject\\Security\\Authentication',
            iteration: 'MyProject\\Sprint 2',
            owner: { displayName: 'Security Team', id: 'security-team-1' },
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://demo.com/testplan/2',
            _links: { self: { href: 'https://demo.com/testplan/2' } },
          },
        ] as AzureDevOpsTestPlan[];

        setTestPlans(testPlansToUse);
        setFilteredTestPlans(testPlansToUse); // Also set filtered plans
        setPagination({
          currentPage: page,
          totalCount: data.data.totalCount || testPlansToUse.length,
          pageSize: pagination.pageSize,
          totalPages: Math.ceil((data.data.totalCount || testPlansToUse.length) / pagination.pageSize),
        });
      } else {
        throw new Error(data.error || 'Failed to load test plans');
      }
    } catch (err) {
      console.error('Failed to load test plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load test plans. Please try again.');
      setTestPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchById = async () => {
    if (!searchById.trim()) {
      setError('Please enter a test plan ID');
      return;
    }

    const testPlanId = parseInt(searchById.trim());
    if (isNaN(testPlanId)) {
      setError('Test plan ID must be a number');
      return;
    }

    setIsSearching(true);
    await loadTestPlans(1, undefined, searchById.trim());
    setIsSearching(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadTestPlans(newPage, searchQuery);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleImportTestPlan = async (testPlan: AzureDevOpsTestPlan) => {
    setSelectedTestPlan(testPlan);
    setIsDetailDialogOpen(true);
    // Reset selection state when opening a new test plan
    setSelectedSuites(new Set());
    setSelectedTestCases(new Set());
    setCurrentSelectedSuite(null);
  };

  const handleSuiteSelect = (suite: AzureDevOpsTestSuite) => {
    setCurrentSelectedSuite(suite);
  };

  const handleTestCaseSelect = (testCase: AzureDevOpsTestCase) => {
    // Handle individual test case selection if needed
    console.log('Selected test case:', testCase);
  };

  const handleSuiteToggle = (suiteId: number, selected: boolean) => {
    const newSelectedSuites = new Set(selectedSuites);
    if (selected) {
      newSelectedSuites.add(suiteId);
    } else {
      newSelectedSuites.delete(suiteId);
    }
    setSelectedSuites(newSelectedSuites);
  };

  const handleTestCaseToggle = (testCaseId: number, selected: boolean) => {
    const newSelectedTestCases = new Set(selectedTestCases);
    if (selected) {
      newSelectedTestCases.add(testCaseId);
    } else {
      newSelectedTestCases.delete(testCaseId);
    }
    setSelectedTestCases(newSelectedTestCases);
  };

  // Safe HTML renderer for descriptions
  const renderDescription = (description: string): JSX.Element => {
    // Simple HTML tag removal and conversion for basic rendering
    const processedDescription = description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<ul>/gi, '')
      .replace(/<\/ul>/gi, '')
      .replace(/<ol>/gi, '')
      .replace(/<\/ol>/gi, '')
      .replace(/<span[^>]*>/gi, '')
      .replace(/<\/span>/gi, '')
      .replace(/<strong>/gi, '')
      .replace(/<\/strong>/gi, '')
      .replace(/<b>/gi, '')
      .replace(/<\/b>/gi, '')
      .replace(/<u>/gi, '')
      .replace(/<\/u>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .trim();

    return (
      <Body1 className={styles.testPlanDescription}>
        {processedDescription.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line.trim() && <span>{line.trim()}</span>}
            {index < processedDescription.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </Body1>
    );
  };

  const getStateBadgeColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'active': return 'success';
      case 'design': return 'warning';
      case 'inactive': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className={styles.container}>
      {/* Shared Navigation */}
      <AppNavigation 
        title="Test Plans"
        actions={
          <Button
            icon={<ArrowClockwiseRegular />}
            appearance="secondary"
            onClick={() => loadTestPlans()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        }
      />

      {/* Main Content */}
      <main className={styles.main}>
        {/* Search Section */}
        <section className={styles.searchSection}>
          <div className={styles.searchBar}>
            <SearchBox
              className={styles.searchInput}
              placeholder="Search test plans by name, description, or owner..."
              value={searchQuery}
              onChange={(_, data) => setSearchQuery(data.value)}
              contentBefore={<SearchRegular />}
            />
            
            {/* Search by ID */}
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' }}>
              <Field label="Search by ID">
                <Input
                  placeholder="Test Plan ID"
                  value={searchById}
                  onChange={(_, data) => setSearchById(data.value)}
                  type="number"
                />
              </Field>
              <Button
                appearance="secondary"
                onClick={handleSearchById}
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            <Menu>
              <MenuTrigger>
                <Button icon={<FilterRegular />} appearance="secondary">
                  Filter
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem>Active Plans</MenuItem>
                  <MenuItem>Design Phase</MenuItem>
                  <MenuItem>All States</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>

          {/* Pagination Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: tokens.spacingVerticalM }}>
            <Text>
              Showing {pagination.totalCount === 0 ? 0 : ((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} test plans
            </Text>
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' }}>
                <Button
                  appearance="subtle"
                  icon={<ChevronLeftRegular />}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                >
                  Previous
                </Button>
                <Text>Page {pagination.currentPage} of {pagination.totalPages}</Text>
                <Button
                  appearance="subtle"
                  icon={<ChevronRightRegular />}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalM }}>
            {error}
          </MessageBar>
        )}

        {/* Results Section */}
        <section className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <Text as="h2" style={{ fontSize: '18px', fontWeight: '600' }}>
              Available Test Plans ({searchQuery ? `${filteredTestPlans.length} filtered` : pagination.totalCount})
            </Text>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingContainer}>
              <Spinner size="large" label="Loading test plans..." />
            </div>
          )}

          {/* Test Plans Grid */}
          {!isLoading && filteredTestPlans.length > 0 && (
            <div className={styles.testPlanGrid}>
              {filteredTestPlans.map((testPlan) => (
                <Card key={testPlan.id} className={styles.testPlanCard}>
                  {/* Direct title rendering - bypassing CardHeader for debugging */}
                  <div className={styles.testPlanTitleSection}>
                    <Text as="h3" className={styles.testPlanTitle}>{testPlan.name || 'Untitled Test Plan'}</Text>
                    <Badge
                      appearance="filled"
                      color={getStateBadgeColor(testPlan.state) as any}
                    >
                      {testPlan.state}
                    </Badge>
                  </div>

                  <div className={styles.testPlanMeta}>
                    <div className={styles.metaItem}>
                      <PersonRegular />
                      <Caption1>{testPlan.owner?.displayName || 'Unknown'}</Caption1>
                    </div>
                    <div className={styles.metaItem}>
                      <CalendarRegular />
                      <Caption1>Created: {formatDate(testPlan.startDate)}</Caption1>
                    </div>
                    {testPlan.areaPath && (
                      <div className={styles.metaItem}>
                        <FolderRegular />
                        <Caption1>Area: {testPlan.areaPath}</Caption1>
                      </div>
                    )}
                    {testPlan.iteration && (
                      <div className={styles.metaItem}>
                        <ArrowClockwiseRegular />
                        <Caption1>Iteration: {testPlan.iteration}</Caption1>
                      </div>
                    )}
                  </div>

                  {testPlan.description && renderDescription(testPlan.description)}

                  <CardFooter>
                    <div className={styles.testPlanActions}>
                      <Button
                        appearance="primary"
                        icon={<ArrowDownloadRegular />}
                        onClick={() => handleImportTestPlan(testPlan)}
                        disabled={isSearching}
                      >
                        {isSearching ? 'Importing...' : 'Import'}
                      </Button>
                      <Button
                        appearance="secondary"
                        icon={<InfoRegular />}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && filteredTestPlans.length > 0 && pagination.totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationInfo}>
                <Caption1>
                  Page {pagination.currentPage} of {pagination.totalPages} 
                  ({pagination.totalCount} total test plans)
                </Caption1>
              </div>
              <div className={styles.paginationControls}>
                <Button
                  appearance="secondary"
                  icon={<ChevronLeftRegular />}
                  disabled={pagination.currentPage === 1}
                  onClick={() => loadTestPlans(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <Caption1 className={styles.pageNumber}>
                  {pagination.currentPage}
                </Caption1>
                <Button
                  appearance="secondary"
                  icon={<ChevronRightRegular />}
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => loadTestPlans(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredTestPlans.length === 0 && (
            <div className={styles.emptyState}>
              <DocumentRegular className={styles.emptyIcon} />
              <Text as="h3" style={{ fontSize: '18px', fontWeight: '600', marginBottom: tokens.spacingVerticalS }}>
                {searchQuery ? 'No test plans found' : 'No test plans available'}
              </Text>
              <Body1 style={{ color: tokens.colorNeutralForeground2 }}>
                {searchQuery 
                  ? 'Try adjusting your search criteria or clear the search to see all available test plans.'
                  : 'Connect to Azure DevOps to load test plans from your project.'
                }
              </Body1>
              {searchQuery && (
                <Button
                  appearance="secondary"
                  onClick={() => setSearchQuery('')}
                  style={{ marginTop: tokens.spacingVerticalM }}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Test Plan Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(_, data) => setIsDetailDialogOpen(data.open)}>
        <DialogSurface style={{ width: '80vw', height: '80vh' }}>
          <DialogBody>
            <DialogTitle>
              {selectedTestPlan?.name} - Test Plan Details
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              {/* Left Column - Tree View */}
              <div className={styles.dialogColumn}>
                <Text as="h3" className={styles.dialogColumnTitle}>
                  Test Plan Structure
                </Text>
                {selectedTestPlan && (
                  <TestPlanTreeView
                    testPlan={selectedTestPlan}
                    onSuiteSelect={handleSuiteSelect}
                    onTestCaseSelect={handleTestCaseSelect}
                    selectedSuites={selectedSuites}
                    selectedTestCases={selectedTestCases}
                    onSuiteToggle={handleSuiteToggle}
                    onTestCaseToggle={handleTestCaseToggle}
                  />
                )}
              </div>

              {/* Right Column - Test Cases */}
              <div className={styles.dialogColumnLast}>
                <Text as="h3" className={styles.dialogColumnTitle}>
                  Test Cases {currentSelectedSuite ? `(${currentSelectedSuite.name})` : '(Select a suite)'}
                </Text>
                <div className={styles.dialogColumnContent}>
                  {currentSelectedSuite ? (
                    <Text style={{ color: tokens.colorNeutralForeground3 }}>
                      📝 Test cases for suite "{currentSelectedSuite.name}" will be displayed here.
                      <br /><br />
                      Suite ID: {currentSelectedSuite.id}
                      <br />
                      Selected: {selectedSuites.has(currentSelectedSuite.id) ? '✅ Yes' : '❌ No'}
                    </Text>
                  ) : (
                    <Text style={{ color: tokens.colorNeutralForeground3 }}>
                      📝 Select a test suite from the tree view to see its test cases here.
                    </Text>
                  )}
                </div>
              </div>
            </DialogContent>
          </DialogBody>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setIsDetailDialogOpen(false)}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={() => {
              // TODO: Implement actual import logic with selected suites
              console.log('Import selected suites from:', selectedTestPlan?.name);
              console.log('Selected suites:', Array.from(selectedSuites));
              console.log('Selected test cases:', Array.from(selectedTestCases));
              alert(`Import functionality will be implemented in the next phase!\n\nSelected:\n- ${selectedSuites.size} test suites\n- ${selectedTestCases.size} test cases`);
              setIsDetailDialogOpen(false);
            }}>
              Import Selected ({selectedSuites.size} suites, {selectedTestCases.size} test cases)
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
