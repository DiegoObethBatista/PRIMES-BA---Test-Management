import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { AzureDevOpsPage } from './pages/AzureDevOpsPage';
import { validateConfig } from './utils/config';

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Main App component
 */
export function App(): JSX.Element {
  // Validate configuration on app start
  try {
    validateConfig();
  } catch (error) {
    console.error('Configuration validation failed:', error);
  }

  return (
    <ErrorBoundary>
      <FluentProvider theme={webLightTheme}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/azure-devops" element={<AzureDevOpsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </QueryClientProvider>
      </FluentProvider>
    </ErrorBoundary>
  );
}