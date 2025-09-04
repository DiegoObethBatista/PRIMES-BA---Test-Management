import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from './SettingsPage';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('SettingsPage - Azure DevOps Connection Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should render all settings sections', () => {
    render(<SettingsPage />);
    
    expect(screen.getByText('Azure DevOps Integration')).toBeInTheDocument();
    expect(screen.getByText('OpenAI Integration')).toBeInTheDocument();
    expect(screen.getByText('Power Platform Integration')).toBeInTheDocument();
  });

  it('should load default Azure DevOps settings on mount', async () => {
    render(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('https://dev.azure.com/PRIMES-DevOps')).toBeInTheDocument();
      expect(screen.getByDisplayValue('PRIMES - BA Team')).toBeInTheDocument();
    });
  });

  it('should show validation error when testing connection with incomplete fields', async () => {
    render(<SettingsPage />);
    
    const testButton = screen.getByText('Test Connection');
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please fill in all Azure DevOps connection fields before testing.')).toBeInTheDocument();
    });
  });

  it('should successfully test Azure DevOps connection', async () => {
    const mockResponse = {
      success: true,
      projects: [
        { id: '1', name: 'PRIMES - BA Team' },
        { id: '2', name: 'Other Project' }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    render(<SettingsPage />);
    
    // Fill in required fields
    const patInput = screen.getByPlaceholderText('Enter your Azure DevOps PAT');
    fireEvent.change(patInput, { target: { value: 'test-pat-token' } });
    
    const testButton = screen.getByText('Test Connection');
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connection successful! Found 2 accessible projects.')).toBeInTheDocument();
    });
    
    expect(mockFetch).toHaveBeenCalledWith('/api/azure-devops/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orgUrl: 'https://dev.azure.com/PRIMES-DevOps',
        project: 'PRIMES - BA Team',
        pat: 'test-pat-token',
      }),
    });
  });

  it('should handle Azure DevOps connection failure', async () => {
    const mockResponse = {
      success: false,
      error: 'Authentication failed'
    };
    
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    render(<SettingsPage />);
    
    // Fill in required fields
    const patInput = screen.getByPlaceholderText('Enter your Azure DevOps PAT');
    fireEvent.change(patInput, { target: { value: 'invalid-pat' } });
    
    const testButton = screen.getByText('Test Connection');
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });
  });

  it('should handle network errors during connection test', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<SettingsPage />);
    
    // Fill in required fields
    const patInput = screen.getByPlaceholderText('Enter your Azure DevOps PAT');
    fireEvent.change(patInput, { target: { value: 'test-pat-token' } });
    
    const testButton = screen.getByText('Test Connection');
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText('Network error occurred while testing connection.')).toBeInTheDocument();
    });
  });

  it('should allow changing projects after successful connection', async () => {
    const mockResponse = {
      success: true,
      projects: [
        { id: '1', name: 'PRIMES - BA Team' },
        { id: '2', name: 'Other Project' }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    render(<SettingsPage />);
    
    // Fill in required fields and test connection
    const patInput = screen.getByPlaceholderText('Enter your Azure DevOps PAT');
    fireEvent.change(patInput, { target: { value: 'test-pat-token' } });
    
    const testButton = screen.getByText('Test Connection');
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Change Project')).toBeInTheDocument();
    });
    
    // Click project dropdown and select different project
    const dropdown = screen.getByPlaceholderText('Change Project');
    fireEvent.click(dropdown);
    
    await waitFor(() => {
      expect(screen.getByText('Other Project')).toBeInTheDocument();
    });
  });

  it('should reset connection test when Azure DevOps settings change', async () => {
    const mockResponse = {
      success: true,
      projects: [{ id: '1', name: 'PRIMES - BA Team' }]
    };
    
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    render(<SettingsPage />);
    
    // Fill in required fields and test connection
    const patInput = screen.getByPlaceholderText('Enter your Azure DevOps PAT');
    fireEvent.change(patInput, { target: { value: 'test-pat-token' } });
    
    const testButton = screen.getByText('Test Connection');
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connection successful! Found 1 accessible projects.')).toBeInTheDocument();
    });
    
    // Change organization URL
    const orgInput = screen.getByDisplayValue('https://dev.azure.com/PRIMES-DevOps');
    fireEvent.change(orgInput, { target: { value: 'https://dev.azure.com/Other-Org' } });
    
    // Connection test message should disappear
    await waitFor(() => {
      expect(screen.queryByText('Connection successful! Found 1 accessible projects.')).not.toBeInTheDocument();
    });
  });

  it('should disable save button until connection is successful', () => {
    render(<SettingsPage />);
    
    const saveButton = screen.getByText('Save All Settings');
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button after successful connection test', async () => {
    const mockResponse = {
      success: true,
      projects: [{ id: '1', name: 'PRIMES - BA Team' }]
    };
    
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    render(<SettingsPage />);
    
    // Fill in required fields and test connection
    const patInput = screen.getByPlaceholderText('Enter your Azure DevOps PAT');
    fireEvent.change(patInput, { target: { value: 'test-pat-token' } });
    
    const testButton = screen.getByText('Test Connection');
    fireEvent.click(testButton);
    
    await waitFor(() => {
      const saveButton = screen.getByText('Save All Settings');
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('should show loading state during connection test', async () => {
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        json: () => Promise.resolve({ success: true, projects: [] })
      }), 100))
    );

    render(<SettingsPage />);
    
    // Fill in required fields
    const patInput = screen.getByPlaceholderText('Enter your Azure DevOps PAT');
    fireEvent.change(patInput, { target: { value: 'test-pat-token' } });
    
    const testButton = screen.getByText('Test Connection');
    fireEvent.click(testButton);
    
    // Should show loading state
    expect(screen.getByText('Testing Connection...')).toBeInTheDocument();
    expect(testButton).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByText('Test Connection')).toBeInTheDocument();
    });
  });
});
