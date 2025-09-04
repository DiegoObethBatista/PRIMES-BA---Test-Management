/**
 * Environment configuration for frontend
 */

interface Config {
  apiUrl: string;
  environment: string;
}

/**
 * Get environment configuration
 */
export function getConfig(): Config {
  return {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    environment: import.meta.env.MODE || 'development',
  };
}

/**
 * Validate required environment variables
 */
export function validateConfig(): void {
  const config = getConfig();
  
  if (!config.apiUrl) {
    throw new Error('VITE_API_URL environment variable is required');
  }
}