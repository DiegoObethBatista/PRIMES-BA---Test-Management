import { Component, ReactNode, ErrorInfo } from 'react';
import { 
  Card, 
  CardHeader, 
  CardPreview, 
  Text, 
  Button, 
  makeStyles 
} from '@fluentui/react-components';
import { ErrorCircle24Regular, ArrowClockwise24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center',
  },
  icon: {
    color: 'var(--colorPaletteRedForeground1)',
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    marginBottom: '8px',
  },
  message: {
    marginBottom: '24px',
    color: 'var(--colorNeutralForeground2)',
  },
  details: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '4px',
    textAlign: 'left',
    fontFamily: 'monospace',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
  },
});

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
}

/**
 * Error boundary component to catch and display React errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        onRetry={this.handleRetry}
        onReload={this.handleReload}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
  onRetry: () => void;
  onReload: () => void;
}

function ErrorFallback({ error, errorInfo, onRetry, onReload }: ErrorFallbackProps): JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Card>
        <CardPreview>
          <ErrorCircle24Regular className={styles.icon} />
        </CardPreview>
        <CardHeader
          header={
            <Text weight="semibold" size={500} className={styles.title}>
              Something went wrong
            </Text>
          }
          description={
            <Text className={styles.message}>
              An unexpected error occurred. You can try refreshing the page or contact support if the problem persists.
            </Text>
          }
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
          <Button 
            appearance="primary" 
            icon={<ArrowClockwise24Regular />}
            onClick={onRetry}
          >
            Try Again
          </Button>
          <Button 
            appearance="secondary" 
            onClick={onReload}
          >
            Reload Page
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && error && (
          <div className={styles.details}>
            <Text weight="semibold">Error Details:</Text>
            {'\n'}
            {error.toString()}
            {errorInfo?.componentStack && (
              <>
                {'\n\nComponent Stack:'}
                {errorInfo.componentStack}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}