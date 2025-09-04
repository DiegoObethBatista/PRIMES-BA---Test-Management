import { 
  makeStyles, 
  shorthands, 
  Text, 
  Card, 
  CardHeader,
  Input,
  Label,
  Field,
  Button,
  Badge,
  Switch,
} from '@fluentui/react-components';
import { Settings24Regular, Save24Regular } from '@fluentui/react-icons';
import { useState } from 'react';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('24px'),
    maxWidth: '800px',
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
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
    '@media (max-width: 768px)': {
      justifyContent: 'stretch',
      flexDirection: 'column',
    },
  },
});

/**
 * Settings page component
 */
export function SettingsPage(): JSX.Element {
  const styles = useStyles();
  
  // Form state
  const [adoOrgUrl, setAdoOrgUrl] = useState('');
  const [adoProject, setAdoProject] = useState('');
  const [adoPat, setAdoPat] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-3.5-turbo');
  const [ppTenantId, setPpTenantId] = useState('');
  const [ppEnvUrl, setPpEnvUrl] = useState('');
  const [authMode, setAuthMode] = useState('service');
  const [costCeiling, setCostCeiling] = useState('10.0');
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    
    // TODO: Implement actual settings save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
  };

  const isFormValid = Boolean(
    adoOrgUrl && 
    adoProject && 
    adoPat && 
    openaiApiKey && 
    ppTenantId && 
    ppEnvUrl
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={600} weight="semibold" className={styles.title}>
          Settings
        </Text>
        <Text className={styles.subtitle}>
          Configure integrations and environment settings
        </Text>
      </div>

      <div className={styles.section}>
        <Card>
          <CardHeader
            header={
              <div className={styles.sectionTitle}>
                <Settings24Regular />
                <Text weight="semibold" size={500}>
                  Azure DevOps Configuration
                </Text>
                <Badge appearance="tint" color="important">Required</Badge>
              </div>
            }
          />
          <div className={styles.form}>
            <div className={styles.formRow}>
              <Field label="Organization URL" required>
                <Input
                  placeholder="https://dev.azure.com/your-org"
                  value={adoOrgUrl}
                  onChange={(_, data) => setAdoOrgUrl(data.value)}
                />
              </Field>
              <Field label="Project Name" required>
                <Input
                  placeholder="Your project name"
                  value={adoProject}
                  onChange={(_, data) => setAdoProject(data.value)}
                />
              </Field>
            </div>
            <Field label="Personal Access Token" required>
              <Input
                type="password"
                placeholder="Enter your Azure DevOps PAT"
                value={adoPat}
                onChange={(_, data) => setAdoPat(data.value)}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <Card>
          <CardHeader
            header={
              <div className={styles.sectionTitle}>
                <Settings24Regular />
                <Text weight="semibold" size={500}>
                  OpenAI Configuration
                </Text>
                <Badge appearance="tint" color="important">Required</Badge>
              </div>
            }
          />
          <div className={styles.form}>
            <div className={styles.formRow}>
              <Field label="API Key" required>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={openaiApiKey}
                  onChange={(_, data) => setOpenaiApiKey(data.value)}
                />
              </Field>
              <Field label="Model">
                <Input
                  placeholder="gpt-3.5-turbo"
                  value={openaiModel}
                  onChange={(_, data) => setOpenaiModel(data.value)}
                />
              </Field>
            </div>
            <Field label="Cost Ceiling per Run (USD)">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="10.00"
                value={costCeiling}
                onChange={(_, data) => setCostCeiling(data.value)}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <Card>
          <CardHeader
            header={
              <div className={styles.sectionTitle}>
                <Settings24Regular />
                <Text weight="semibold" size={500}>
                  Power Platform Configuration
                </Text>
                <Badge appearance="tint" color="important">Required</Badge>
              </div>
            }
          />
          <div className={styles.form}>
            <div className={styles.formRow}>
              <Field label="Tenant ID" required>
                <Input
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={ppTenantId}
                  onChange={(_, data) => setPpTenantId(data.value)}
                />
              </Field>
              <Field label="Environment URL" required>
                <Input
                  placeholder="https://your-env.powerapps.com"
                  value={ppEnvUrl}
                  onChange={(_, data) => setPpEnvUrl(data.value)}
                />
              </Field>
            </div>
            <Field label="Authentication Mode">
              <Switch
                checked={authMode === 'interactive'}
                onChange={(_, data) => setAuthMode(data.checked ? 'interactive' : 'service')}
                label={authMode === 'interactive' ? 'Interactive Login' : 'Service Principal'}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className={styles.actions}>
        <Button 
          appearance="primary" 
          icon={<Save24Regular />}
          disabled={!isFormValid || isSaving}
          onClick={handleSave}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button appearance="secondary">
          Cancel
        </Button>
      </div>
    </div>
  );
}