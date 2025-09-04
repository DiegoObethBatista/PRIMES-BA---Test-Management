import React, { useState, useEffect } from 'react';
import {
  Tree,
  TreeItem,
  TreeItemLayout,
  Button,
  Text,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  FolderRegular,
  DocumentRegular,
  ChevronRightRegular,
  ChevronDownRegular,
} from '@fluentui/react-icons';
import type { AzureDevOpsTestPlan, AzureDevOpsTestSuite, AzureDevOpsTestCase } from '@primes-ba/shared';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const useStyles = makeStyles({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  treeContainer: {
    flex: 1,
    overflow: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
  },
  errorContainer: {
    padding: tokens.spacingVerticalM,
    color: tokens.colorPaletteRedForeground1,
  },
});

interface TestPlanTreeViewProps {
  testPlan: AzureDevOpsTestPlan;
  onSuiteSelect?: (suite: AzureDevOpsTestSuite) => void;
  onTestCaseSelect?: (testCase: AzureDevOpsTestCase) => void;
  selectedSuites?: Set<number>;
  selectedTestCases?: Set<number>;
  onSuiteToggle?: (suiteId: number, selected: boolean) => void;
  onTestCaseToggle?: (testCaseId: number, selected: boolean) => void;
}

interface TreeNode {
  id: string;
  type: 'plan' | 'suite' | 'testcase';
  name: string;
  data: AzureDevOpsTestPlan | AzureDevOpsTestSuite | AzureDevOpsTestCase;
  children?: TreeNode[];
  isLoading?: boolean;
  isExpanded?: boolean;
  isSelected?: boolean;
}

export function TestPlanTreeView({
  testPlan,
  onSuiteSelect,
  onTestCaseSelect,
  selectedSuites = new Set(),
  selectedTestCases = new Set(),
  onSuiteToggle,
  onTestCaseToggle,
}: TestPlanTreeViewProps): JSX.Element {
  const styles = useStyles();
  const { config } = useAuth();
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['plan-' + testPlan.id]));

  useEffect(() => {
    loadInitialTree();
  }, [testPlan]);

  const loadInitialTree = async () => {
    setLoading(true);
    setError('');

    try {
      if (!config) {
        throw new Error('Authentication configuration not found');
      }

      // Load test suites for the test plan
      const suites = await apiClient.getAzureDevOpsTestSuites(config.projectName, testPlan.id);
      
      if (!suites.success) {
        throw new Error(suites.error || 'Failed to load test suites');
      }

      // If no real suites, create mock data for demonstration
      const actualSuites = suites.data && suites.data.length > 0 ? suites.data : [
        { id: 1, name: 'Smoke Tests', description: 'Critical path testing', state: 'Active' },
        { id: 2, name: 'Regression Tests', description: 'Full regression suite', state: 'Active' },
        { id: 3, name: 'API Tests', description: 'Backend API validation', state: 'Active' },
      ] as any[];

      // Create tree structure
      const planNode: TreeNode = {
        id: `plan-${testPlan.id}`,
        type: 'plan',
        name: testPlan.name,
        data: testPlan,
        isExpanded: true,
        children: actualSuites.map(suite => ({
          id: `suite-${suite.id}`,
          type: 'suite',
          name: suite.name,
          data: suite,
          isExpanded: false,
          isSelected: selectedSuites.has(suite.id),
          children: [], // Will be loaded on demand
        })),
      };

      setTreeData([planNode]);
    } catch (err) {
      console.error('Failed to load tree data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load test plan structure');
    } finally {
      setLoading(false);
    }
  };

  const loadTestCases = async (suiteId: number): Promise<TreeNode[]> => {
    try {
      if (!config) {
        throw new Error('Authentication configuration not found');
      }

      // For demo purposes, create relevant mock test cases based on suite
      const mockTestCasesByType: { [key: number]: TreeNode[] } = {
        1: [ // Smoke Tests
          {
            id: `testcase-1-1`,
            type: 'testcase',
            name: 'Login functionality test',
            data: { id: 1, title: 'Login functionality test', state: 'Active' } as any,
            isSelected: selectedTestCases.has(1),
          },
          {
            id: `testcase-1-2`,
            type: 'testcase',
            name: 'Critical navigation test',
            data: { id: 2, title: 'Critical navigation test', state: 'Active' } as any,
            isSelected: selectedTestCases.has(2),
          },
        ],
        2: [ // Regression Tests
          {
            id: `testcase-2-1`,
            type: 'testcase',
            name: 'Data validation test',
            data: { id: 3, title: 'Data validation test', state: 'Active' } as any,
            isSelected: selectedTestCases.has(3),
          },
          {
            id: `testcase-2-2`,
            type: 'testcase',
            name: 'User workflow test',
            data: { id: 4, title: 'User workflow test', state: 'Active' } as any,
            isSelected: selectedTestCases.has(4),
          },
          {
            id: `testcase-2-3`,
            type: 'testcase',
            name: 'Edge case handling test',
            data: { id: 5, title: 'Edge case handling test', state: 'Active' } as any,
            isSelected: selectedTestCases.has(5),
          },
        ],
        3: [ // API Tests
          {
            id: `testcase-3-1`,
            type: 'testcase',
            name: 'REST API endpoint test',
            data: { id: 6, title: 'REST API endpoint test', state: 'Active' } as any,
            isSelected: selectedTestCases.has(6),
          },
          {
            id: `testcase-3-2`,
            type: 'testcase',
            name: 'Authentication API test',
            data: { id: 7, title: 'Authentication API test', state: 'Active' } as any,
            isSelected: selectedTestCases.has(7),
          },
        ],
      };

      return mockTestCasesByType[suiteId] || [
        {
          id: `testcase-${suiteId}-default`,
          type: 'testcase',
          name: `Sample test case for suite ${suiteId}`,
          data: { id: 999, title: `Sample test case for suite ${suiteId}`, state: 'Active' } as any,
          isSelected: false,
        },
      ];
    } catch (err) {
      console.error('Failed to load test cases:', err);
      return [];
    }
  };

  const handleNodeExpand = async (nodeId: string) => {
    const newExpandedNodes = new Set(expandedNodes);
    
    if (expandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
      
      // Load test cases if expanding a suite
      if (nodeId.startsWith('suite-')) {
        const suiteId = parseInt(nodeId.replace('suite-', ''));
        const testCases = await loadTestCases(suiteId);
        
        // Update tree data with loaded test cases
        setTreeData(prevData => {
          const updateNode = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(node => {
              if (node.id === nodeId) {
                return { ...node, children: testCases, isExpanded: true };
              }
              if (node.children) {
                return { ...node, children: updateNode(node.children) };
              }
              return node;
            });
          };
          return updateNode(prevData);
        });
      }
    }
    
    setExpandedNodes(newExpandedNodes);
  };

  const handleNodeSelect = (node: TreeNode) => {
    if (node.type === 'suite') {
      const suite = node.data as AzureDevOpsTestSuite;
      onSuiteSelect?.(suite);
      onSuiteToggle?.(suite.id, !selectedSuites.has(suite.id));
    } else if (node.type === 'testcase') {
      const testCase = node.data as AzureDevOpsTestCase;
      onTestCaseSelect?.(testCase);
      onTestCaseToggle?.(testCase.id, !selectedTestCases.has(testCase.id));
    }
  };

  const renderTreeNode = (node: TreeNode): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    
    const getIcon = () => {
      switch (node.type) {
        case 'plan':
          return <DocumentRegular />;
        case 'suite':
          return <FolderRegular />;
        case 'testcase':
          return <DocumentRegular />;
        default:
          return <DocumentRegular />;
      }
    };

    const getExpandIcon = () => {
      if (!hasChildren && node.type !== 'suite') return null;
      return isExpanded ? <ChevronDownRegular /> : <ChevronRightRegular />;
    };

    return (
      <TreeItem
        key={node.id}
        itemType={hasChildren || node.type === 'suite' ? 'branch' : 'leaf'}
      >
        <TreeItemLayout
          iconBefore={getIcon()}
          iconAfter={getExpandIcon()}
          onClick={() => {
            if (hasChildren || node.type === 'suite') {
              handleNodeExpand(node.id);
            }
            handleNodeSelect(node);
          }}
          style={{
            backgroundColor: node.isSelected ? tokens.colorNeutralBackground1Selected : 'transparent',
            cursor: 'pointer',
          }}
        >
          <Text>{node.name}</Text>
          {node.type === 'suite' && selectedSuites.has((node.data as AzureDevOpsTestSuite).id) && (
            <Text style={{ marginLeft: tokens.spacingHorizontalS, color: tokens.colorPaletteGreenForeground1 }}>
              ✓ Selected
            </Text>
          )}
          {node.type === 'testcase' && selectedTestCases.has((node.data as AzureDevOpsTestCase).id) && (
            <Text style={{ marginLeft: tokens.spacingHorizontalS, color: tokens.colorPaletteGreenForeground1 }}>
              ✓ Selected
            </Text>
          )}
        </TreeItemLayout>
        {isExpanded && hasChildren && (
          <Tree>
            {node.children?.map(child => renderTreeNode(child))}
          </Tree>
        )}
      </TreeItem>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spinner size="medium" label="Loading test plan structure..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <Text>{error}</Text>
          <Button
            appearance="primary"
            onClick={loadInitialTree}
            style={{ marginTop: tokens.spacingVerticalS }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.treeContainer}>
        <Tree>
          {treeData.map(node => renderTreeNode(node))}
        </Tree>
      </div>
    </div>
  );
}
