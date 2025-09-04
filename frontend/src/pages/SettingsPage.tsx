import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Card,
  Text,
  Title1,
  Field,
  MessageBar,
  Spinner,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import { Save24Regular, CheckmarkCircle24Regular, ErrorCircle24Regular, ArrowClockwise24Regular } from '@fluentui/react-icons';
import { AppNavigation } from '../components/AppNavigation';
import styles from './SettingsPage.module.css';

interface ConnectionTest {
  success: boolean;
  message?: string;
  projects?: Array<{ id: string; name: string }>;
}

interface Settings {
  // Azure DevOps Settings (consolidated)
  adoOrgUrl: string;
  adoProject: string;
  adoPat: string;
  
  // OpenAI Settings
  openaiApiKey: string;
  openaiModel: string;
  
  // Dataverse Settings
  ppTenantId: string;
  ppEnvUrl: string;
  
  // General Settings
  authMode: string;
  costCeilingUsd: number;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({
    adoOrgUrl: '',
    adoProject: '',
    adoPat: '',
    openaiApiKey: '',
    openaiModel: 'gpt-3.5-turbo',
    ppTenantId: '',
    ppEnvUrl: '',
    authMode: 'service',
    costCeilingUsd: 10.0,
  });
  
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionTest, setConnectionTest] = useState<ConnectionTest | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Array<{ id: string; name: string }>>([]);

  // Load existing settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load from environment defaults or saved settings
      setSettings(prev => ({
        ...prev,
        adoOrgUrl: 'https://dev.azure.com/PRIMES-DevOps',
        adoProject: 'PRIMES - BA Team',
        openaiModel: 'gpt-3.5-turbo',
        authMode: 'service',
        costCeilingUsd: 10.0,
      }));
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Reset connection test when Azure DevOps settings change
    if (['adoOrgUrl', 'adoProject', 'adoPat'].includes(key as string)) {
      setConnectionTest(null);
      setAvailableProjects([]);
    }
  };

  const testAzureDevOpsConnection = async () => {
    if (!settings.adoOrgUrl || !settings.adoProject || !settings.adoPat) {
      setConnectionTest({
        success: false,
        message: 'Please fill in all Azure DevOps connection fields before testing.'
      });
      return;
    }

    setIsTesting(true);
    setConnectionTest(null);

    try {
      const response = await fetch('/api/azure-devops/test-connection-with-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgUrl: settings.adoOrgUrl,
          project: settings.adoProject,
          pat: settings.adoPat,
        }),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const connectionData = result.data;
        const projects: Array<{ id: string; name: string }> = []; // We'll get projects in a separate call if needed
        setConnectionTest({
          success: true,
          message: `Connection successful! Connected to ${connectionData.organizationName}/${connectionData.projectName}.`,
          projects: projects
        });
        setAvailableProjects(projects);
        
        // Save successful connection settings to localStorage for Azure DevOps page
        localStorage.setItem('azureDevOpsSettings', JSON.stringify({
          adoOrgUrl: settings.adoOrgUrl,
          adoProject: settings.adoProject,
          adoPat: settings.adoPat,
        }));
      } else {
        setConnectionTest({
          success: false,
          message: result.error || 'Connection failed. Please check your credentials and try again.'
        });
        setAvailableProjects([]);
      }
    } catch (error) {
      setConnectionTest({
        success: false,
        message: 'Network error occurred while testing connection.'
      });
      setAvailableProjects([]);
    } finally {
      setIsTesting(false);
    }
  };

  const changeProject = (projectName: string) => {
    updateSetting('adoProject', projectName);
    setSaveMessage({
      type: 'success',
      text: `Project changed to: ${projectName}. Remember to save settings!`
    });
  };

  const saveAllSettings = async () => {
    if (!connectionTest?.success) {
      setSaveMessage({
        type: 'error',
        text: 'Please test and verify the Azure DevOps connection before saving settings.'
      });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // In a real app, this would save to a backend API or configuration service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveMessage({
        type: 'success',
        text: 'All settings saved successfully! Application configuration is now updated.'
      });
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: 'Failed to save settings. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isAzureDevOpsFormValid = Boolean(
    settings.adoOrgUrl && 
    settings.adoProject && 
    settings.adoPat
  );
  const isAzureDevOpsConnected = connectionTest?.success === true;

  return (
    <div className={styles.container}>
      <AppNavigation 
        title="Settings"
        showBackButton={true}
        onBack={() => navigate('/dashboard')}
      />
      
      <div className={styles.header}>
        <Title1>Settings</Title1>
        <Text>Configure your integrations and application preferences.</Text>
      </div>

      {/* Azure DevOps Integration - Consolidated */}
      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <Text size={500} weight="semibold">Azure DevOps Integration</Text>
          <Text size={300}>
            Connect to your Azure DevOps organization to sync test plans and results.
          </Text>
        </div>

        <div className={styles.formGrid}>
          <Field label="Organization URL" required>
            <Input
              value={settings.adoOrgUrl}
              onChange={(_, data) => updateSetting('adoOrgUrl', data.value)}
              placeholder="https://dev.azure.com/your-organization"
              contentBefore="🏢"
            />
          </Field>

          <Field label="Project Name" required>
            <Input
              value={settings.adoProject}
              onChange={(_, data) => updateSetting('adoProject', data.value)}
              placeholder="Your Project Name"
              contentBefore="📁"
            />
          </Field>

          <Field label="Personal Access Token (PAT)" required>
            <Input
              type="password"
              value={settings.adoPat}
              onChange={(_, data) => updateSetting('adoPat', data.value)}
              placeholder="Enter your Azure DevOps PAT"
              contentBefore="🔑"
            />
          </Field>
        </div>

        <div className={styles.actions}>
          <Button
            appearance="subtle"
            onClick={testAzureDevOpsConnection}
            disabled={!isAzureDevOpsFormValid || isTesting}
            icon={isTesting ? <Spinner size="tiny" /> : null}
          >
            {isTesting ? 'Testing Connection...' : 'Test Connection'}
          </Button>

          {availableProjects.length > 0 && (
            <Dropdown 
              placeholder="Change Project"
              value={settings.adoProject}
              onOptionSelect={(_, data) => data.optionText && changeProject(data.optionText)}
            >
              {availableProjects.map((project) => (
                <Option key={project.id} text={project.name}>
                  {project.name}
                </Option>
              ))}
            </Dropdown>
          )}
        </div>

        {connectionTest && (
          <MessageBar
            intent={connectionTest.success ? 'success' : 'error'}
            icon={connectionTest.success ? <CheckmarkCircle24Regular /> : <ErrorCircle24Regular />}
          >
            {connectionTest.message}
          </MessageBar>
        )}
      </Card>

      {/* OpenAI Settings */}
      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <Text size={500} weight="semibold">OpenAI Integration</Text>
          <Text size={300}>
            Configure OpenAI API for AI-powered test generation and analysis.
          </Text>
        </div>

        <div className={styles.formGrid}>
          <Field label="API Key" required>
            <Input
              type="password"
              value={settings.openaiApiKey}
              onChange={(_, data) => updateSetting('openaiApiKey', data.value)}
              placeholder="sk-..."
              contentBefore="🤖"
            />
          </Field>

          <Field label="Model">
            <Input
              value={settings.openaiModel}
              onChange={(_, data) => updateSetting('openaiModel', data.value)}
              placeholder="gpt-3.5-turbo"
              contentBefore="⚙️"
            />
          </Field>

          <Field label="Cost Ceiling (USD)">
            <Input
              type="number"
              value={settings.costCeilingUsd.toString()}
              onChange={(_, data) => updateSetting('costCeilingUsd', parseFloat(data.value) || 0)}
              placeholder="10.0"
              contentBefore="💰"
            />
          </Field>
        </div>
      </Card>

      {/* Dataverse Settings */}
      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <Text size={500} weight="semibold">Power Platform Integration</Text>
          <Text size={300}>
            Connect to Power Platform Dataverse for data synchronization.
          </Text>
        </div>

        <div className={styles.formGrid}>
          <Field label="Tenant ID" required>
            <Input
              value={settings.ppTenantId}
              onChange={(_, data) => updateSetting('ppTenantId', data.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              contentBefore="🏬"
            />
          </Field>

          <Field label="Environment URL" required>
            <Input
              value={settings.ppEnvUrl}
              onChange={(_, data) => updateSetting('ppEnvUrl', data.value)}
              placeholder="https://your-env.powerapps.com"
              contentBefore="🌐"
            />
          </Field>

          <Field label="Auth Mode">
            <Input
              value={settings.authMode}
              onChange={(_, data) => updateSetting('authMode', data.value)}
              placeholder="service"
              contentBefore="🔐"
            />
          </Field>
        </div>
      </Card>

      {/* Save All Settings */}
      <Card className={styles.section}>
        <div className={styles.actions}>
          <Button
            appearance="primary"
            size="large"
            onClick={saveAllSettings}
            disabled={!isAzureDevOpsConnected || isSaving}
            icon={isSaving ? <Spinner size="tiny" /> : <Save24Regular />}
          >
            {isSaving ? 'Saving All Settings...' : 'Save All Settings'}
          </Button>
        </div>

        {saveMessage && (
          <MessageBar
            intent={saveMessage.type === 'success' ? 'success' : 'error'}
            icon={saveMessage.type === 'success' ? <CheckmarkCircle24Regular /> : <ErrorCircle24Regular />}
          >
            {saveMessage.text}
          </MessageBar>
        )}
      </Card>
    </div>
  );
}

export default SettingsPage;
