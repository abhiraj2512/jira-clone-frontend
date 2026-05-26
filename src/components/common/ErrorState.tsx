import React from 'react';
import { Button } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message = 'An unexpected error occurred.', onRetry }) => {
  return (
    <div className={styles.container} id="error-state">
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <WarningOutlined className={styles.icon} />
        </div>
        <h3 className={styles.title}>Something went wrong</h3>
        <p className={styles.description}>{message}</p>
        {onRetry && (
          <Button type="primary" onClick={onRetry} className={styles.button}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
