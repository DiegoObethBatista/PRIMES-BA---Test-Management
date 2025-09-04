import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardFooter,
  Text,
  Button,
  makeStyles,
  tokens,
  Badge,
  Body1,
  Caption1,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Avatar,
  Divider,
} from '@fluentui/react-components';
import {
  DocumentRegular,
  SettingsRegular,
  ClipboardTaskRegular,
  PlayRegular,
  DatabaseRegular,
  StatusRegular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  welcomeSection: {
    marginBottom: tokens.spacingVerticalXL,
  },
  welcomeCard: {
    padding: tokens.spacingVerticalL,
    backgroundColor: `linear-gradient(135deg, ${tokens.colorBrandBackground2}, ${tokens.colorBrandBackground})`,
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalS,
  },
  welcomeSubtitle: {
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalM,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalXL,
  },
  actionCard: {
    padding: tokens.spacingVerticalL,
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  actionIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalS,
  },
  actionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: tokens.spacingVerticalS,
  },
  actionDescription: {
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalM,
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  statCard: {
    padding: tokens.spacingVerticalM,
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: tokens.colorBrandForeground1,
  },
  statLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: '14px',
  },
});

export function DashboardPage(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const { config, logout } = useAuth();
  const [stats, setStats] = useState({
    testCases: 0,
    testRuns: 0,
    apiCalls: 0,
  });

  useEffect(() => {
    // Config is guaranteed to exist due to ProtectedRoute
    if (!config) {
      navigate('/login');
      return;
    }
    
    // Load system stats
    fetchSystemStats();
  }, [navigate, config]);

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      if (data.database) {
        setStats({
          testCases: data.database.testCases || 0,
          testRuns: data.database.testRuns || 0,
          apiCalls: data.database.tokenUsage || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateToTestPlans = () => {
    navigate('/test-plans');
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  if (!config) {
    return <div>Loading...</div>;
  }

  const organizationName = config.organizationUrl.split('/').pop() || 'Azure DevOps';

  return (
    <div className={styles.container}>
      {/* Shared Navigation */}
      <AppNavigation title="Dashboard" />

      {/* Main Content */}
      <main className={styles.main}>
        {/* Welcome Section */}
        <section className={styles.welcomeSection}>
          <Card className={styles.welcomeCard}>
            <Text className={styles.welcomeTitle}>
              Welcome to Test Management Platform
            </Text>
            <Body1 className={styles.welcomeSubtitle}>
              Connected to {config.projectName} in {organizationName}
            </Body1>
            <div className={styles.statusBadge}>
              <StatusRegular color="green" />
              <Badge appearance="filled" color="success">
                Connected
              </Badge>
            </div>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className={styles.quickActions}>
          <Card className={styles.actionCard} onClick={navigateToTestPlans}>
            <ClipboardTaskRegular className={styles.actionIcon} />
            <Text className={styles.actionTitle}>Test Plans</Text>
            <Body1 className={styles.actionDescription}>
              Search, browse, and import test plans from Azure DevOps
            </Body1>
            <Button appearance="primary" icon={<DocumentRegular />}>
              Manage Test Plans
            </Button>
          </Card>

          <Card className={styles.actionCard} onClick={() => navigate('/test-runs')}>
            <PlayRegular className={styles.actionIcon} />
            <Text className={styles.actionTitle}>Test Execution</Text>
            <Body1 className={styles.actionDescription}>
              Execute test cases and track results
            </Body1>
            <Button appearance="secondary" icon={<PlayRegular />}>
              Run Tests
            </Button>
          </Card>

          <Card className={styles.actionCard} onClick={navigateToSettings}>
            <SettingsRegular className={styles.actionIcon} />
            <Text className={styles.actionTitle}>Settings</Text>
            <Body1 className={styles.actionDescription}>
              Configure integrations and preferences
            </Body1>
            <Button appearance="secondary" icon={<SettingsRegular />}>
              Open Settings
            </Button>
          </Card>
        </section>

        {/* System Statistics */}
        <section>
          <Text as="h2" style={{ fontSize: '20px', fontWeight: '600', marginBottom: tokens.spacingVerticalM }}>
            System Overview
          </Text>
          <div className={styles.stats}>
            <Card className={styles.statCard}>
              <Text className={styles.statNumber}>{stats.testCases}</Text>
              <Caption1 className={styles.statLabel}>Test Cases</Caption1>
            </Card>
            <Card className={styles.statCard}>
              <Text className={styles.statNumber}>{stats.testRuns}</Text>
              <Caption1 className={styles.statLabel}>Test Runs</Caption1>
            </Card>
            <Card className={styles.statCard}>
              <Text className={styles.statNumber}>{stats.apiCalls}</Text>
              <Caption1 className={styles.statLabel}>API Calls</Caption1>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
