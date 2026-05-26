import React from 'react';
import { Spin } from 'antd';
import styles from './PageLoader.module.css';

const PageLoader: React.FC = () => {
  return (
    <div className={styles.container} id="page-loader">
      <div className={styles.loaderBox}>
        <Spin size="large" />
        <span className={styles.loadingText}>Loading...</span>
      </div>
    </div>
  );
};

export default PageLoader;
