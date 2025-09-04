import { 
  makeStyles, 
  shorthands, 
  Text, 
  Card, 
  CardHeader,
  CardPreview,
  Button,
  Badge,
} from '@fluentui/react-components';
import { CheckmarkCircle24Regular, Home24Regular, CloudRegular } from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { Loading } from '../components/Loading';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('24px'),
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  title: {
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--colorNeutralForeground2)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  statusCard: {
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
    },
  },
  icon: {
    fontSize: '48px',
    color: 'var(--colorBrandForeground1)',
  },
  stats: {
    display: 'flex',
    gap: '16px',
    marginTop: '16px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
});

/**
 * Home page component
 */
export function HomePage(): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();

  // Health check query
  const { data: healthData, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleNavigateToSettings = (): void => {
    navigate('/settings');
  };

  if (isLoading) {
    return <Loading message="Checking system status..." />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Text size={600} weight="semibold" className={styles.title}>
            PRIMES BA - Test Management Platform
          </Text>
          <Text className={styles.subtitle}>
            Unable to connect to the backend service
          </Text>
        </div>
      </div>
    );
  }

  const isHealthy = healthData?.data?.status === 'healthy';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={600} weight="semibold" className={styles.title}>
          PRIMES BA - Test Management Platform
        </Text>
        <Text className={styles.subtitle}>
          AI-assisted Power Platform test automation with Azure DevOps integration
        </Text>
      </div>

      <div className={styles.grid}>
        <Card className={styles.statusCard}>
          <CardPreview>
            <CheckmarkCircle24Regular className={styles.icon} />
          </CardPreview>
          <CardHeader
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text weight="semibold">System Status</Text>
                <Badge 
                  appearance={isHealthy ? 'filled' : 'ghost'} 
                  color={isHealthy ? 'success' : 'danger'}
                >
                  {isHealthy ? 'Healthy' : 'Unhealthy'}
                </Badge>
              </div>
            }
            description={
              <div>
                <Text>
                  Database: {(healthData?.data as any)?.database === 'connected' ? 'Connected' : 'Disconnected'}
                </Text>
                <Text>
                  Uptime: {Math.floor((healthData?.data?.uptime ?? 0) / 60)} minutes
                </Text>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <Text weight="semibold" size={400}>
                      {(healthData?.data as any)?.testCases ?? 0}
                    </Text>
                    <Text size={200}>Test Cases</Text>
                  </div>
                  <div className={styles.stat}>
                    <Text weight="semibold" size={400}>
                      {(healthData?.data as any)?.testRuns ?? 0}
                    </Text>
                    <Text size={200}>Test Runs</Text>
                  </div>
                  <div className={styles.stat}>
                    <Text weight="semibold" size={400}>
                      {(healthData?.data as any)?.tokenUsage ?? 0}
                    </Text>
                    <Text size={200}>API Calls</Text>
                  </div>
                </div>
              </div>
            }
          />
        </Card>

        <Card className={styles.statusCard} onClick={handleNavigateToSettings}>
          <CardPreview>
            <Home24Regular className={styles.icon} />
          </CardPreview>
          <CardHeader
            header={<Text weight="semibold">Settings</Text>}
            description={
              <div>
                <Text>Configure Azure DevOps integration, OpenAI settings, and Power Platform environments.</Text>
                <div style={{ marginTop: '16px' }}>
                  <Button appearance="primary">
                    Open Settings
                  </Button>
                </div>
              </div>
            }
          />
        </Card>
      </div>
    </div>
  );
}