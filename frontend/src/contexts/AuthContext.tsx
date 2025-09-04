import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AzureDevOpsConfig {
  organizationUrl: string;
  projectName: string;
  projectId: string;
  personalAccessToken: string;
  isAuthenticated: boolean;
  authenticatedAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  config: AzureDevOpsConfig | null;
  login: (config: AzureDevOpsConfig) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState<AzureDevOpsConfig | null>(null);

  useEffect(() => {
    // Check for existing authentication on app load
    const storedConfig = localStorage.getItem('azureDevOpsConfig');
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        if (parsedConfig.isAuthenticated) {
          setConfig(parsedConfig);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to parse stored config:', error);
        localStorage.removeItem('azureDevOpsConfig');
      }
    }
  }, []);

  const login = (newConfig: AzureDevOpsConfig) => {
    setConfig(newConfig);
    setIsAuthenticated(true);
    localStorage.setItem('azureDevOpsConfig', JSON.stringify(newConfig));
  };

  const logout = () => {
    setConfig(null);
    setIsAuthenticated(false);
    localStorage.removeItem('azureDevOpsConfig');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, config, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
