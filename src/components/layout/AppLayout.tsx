import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import styles from './AppLayout.module.css';

const { Content } = Layout;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className={styles.layoutContainer} id="app-layout">
      <AppSidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout className={styles.mainLayout}>
        <AppHeader />
        <Content className={styles.content}>
          <div className={styles.innerContent}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
