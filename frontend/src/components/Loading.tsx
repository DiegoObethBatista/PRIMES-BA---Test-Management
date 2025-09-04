import { Spinner, Text, makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    gap: '16px',
  },
  spinner: {
    fontSize: '32px',
  },
});

interface Props {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Loading component with spinner and optional message
 */
export function Loading({ message = 'Loading...', size = 'medium' }: Props): JSX.Element {
  const styles = useStyles();

  const spinnerSize = size === 'small' ? 'tiny' : size === 'large' ? 'huge' : 'medium';

  return (
    <div className={styles.container}>
      <Spinner 
        size={spinnerSize}
        className={styles.spinner}
        label={message}
      />
      <Text size={300} style={{ color: 'var(--colorNeutralForeground2)' }}>
        {message}
      </Text>
    </div>
  );
}