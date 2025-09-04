import type { ApiResponse } from '@primes-ba/shared';
import { getConfig } from '../utils/config';

/**
 * HTTP client for API requests
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getConfig().apiUrl;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json() as ApiResponse<T>;

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const config: RequestInit = {
      method: 'POST',
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    return this.request<T>(endpoint, config);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const config: RequestInit = {
      method: 'PUT',
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    return this.request<T>(endpoint, config);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; uptime: number }>> {
    return this.get('/health');
  }
}

export const apiClient = new ApiClient();