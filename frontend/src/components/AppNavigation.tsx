import React, { useState } from 'react';
import {
  Text,
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Avatar,
  Divider,
  Input,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Field,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  HomeRegular,
  SettingsRegular,
  PersonRegular,
  SignOutRegular,
  ChevronDownRegular,
  ArrowSyncRegular,
  BuildingRegular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  logo: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: tokens.colorBrandForeground1,
  },
  projectInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  projectName: {
    fontSize: '14px',
    fontWeight: '600',
  },
  organizationName: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
});

interface AppNavigationProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function AppNavigation({ title, showBackButton, onBack, actions }: AppNavigationProps): JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const { config, logout } = useAuth();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState(config?.projectName || '');
  const [newOrgUrl, setNewOrgUrl] = useState(config?.organizationUrl || '');
  const [newPat, setNewPat] = useState('');

  const organizationName = config?.organizationUrl?.replace('https://dev.azure.com/', '') || 'Unknown';

  const handleProjectSwitch = () => {
    if (!newProjectName.trim() || !newOrgUrl.trim() || !newPat.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const newConfig = {
      organizationUrl: newOrgUrl.trim(),
      projectName: newProjectName.trim(),
      personalAccessToken: newPat.trim(),
      isAuthenticated: true,
      authenticatedAt: new Date().toISOString(),
    };

    // Update the config (this will trigger a re-login)
    logout(); // Clear current session
    setTimeout(() => {
      localStorage.setItem('azureDevOpsConfig', JSON.stringify(newConfig));
      window.location.reload(); // Reload to re-authenticate with new config
    }, 100);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Text className={styles.logo}>PRIMES BA</Text>
          {title && (
            <>
              <Text>/</Text>
              <Text weight="semibold">{title}</Text>
            </>
          )}
          {showBackButton && (
            <Button
              appearance="subtle"
              onClick={onBack}
            >
              ← Back
            </Button>
          )}
        </div>

        <div className={styles.headerRight}>
          {/* Project Info with Switch Option */}
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                icon={<BuildingRegular />}
                iconPosition="before"
              >
                <div className={styles.projectInfo}>
                  <Text className={styles.projectName}>{config?.projectName}</Text>
                  <Text className={styles.organizationName}>{organizationName}</Text>
                </div>
                <ChevronDownRegular />
              </Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<ArrowSyncRegular />}
                  onClick={() => setIsProjectDialogOpen(true)}
                >
                  Switch Project
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>

          {/* Custom Actions */}
          {actions}

          {/* User Menu */}
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                icon={<Avatar name="User" size={24} />}
              >
                <ChevronDownRegular />
              </Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<HomeRegular />}
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </MenuItem>
                <MenuItem
                  icon={<SettingsRegular />}
                  onClick={() => navigate('/settings')}
                >
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem
                  icon={<SignOutRegular />}
                  onClick={handleLogout}
                >
                  Sign Out
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </header>

      {/* Project Switch Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={(_, data) => setIsProjectDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Switch Azure DevOps Project</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              <Field label="Organization URL" required>
                <Input
                  value={newOrgUrl}
                  onChange={(_, data) => setNewOrgUrl(data.value)}
                  placeholder="https://dev.azure.com/your-org"
                />
              </Field>
              
              <Field label="Project Name" required>
                <Input
                  value={newProjectName}
                  onChange={(_, data) => setNewProjectName(data.value)}
                  placeholder="Enter project name"
                />
              </Field>
              
              <Field label="Personal Access Token" required>
                <Input
                  type="password"
                  value={newPat}
                  onChange={(_, data) => setNewPat(data.value)}
                  placeholder="Enter your PAT"
                />
              </Field>
              
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Note: Switching projects will require re-authentication and reload the application.
              </Text>
            </DialogContent>
          </DialogBody>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={handleProjectSwitch}>
              Switch Project
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
}
