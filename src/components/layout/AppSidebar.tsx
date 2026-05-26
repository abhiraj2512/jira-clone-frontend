import React from 'react';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, ProjectOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './AppSidebar.module.css';

const { Sider } = Layout;

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active menu item based on current path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      return 'dashboard';
    }
    if (path.startsWith('/projects')) {
      return 'projects';
    }
    return 'dashboard';
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined className={styles.menuIcon} />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'projects',
      icon: <ProjectOutlined className={styles.menuIcon} />,
      label: 'Projects',
      onClick: () => navigate('/dashboard'),
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={240}
      collapsedWidth={80}
      theme="light"
      className={styles.sider}
      id="app-sidebar"
    >
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>J</div>
        {!collapsed && <span className={styles.logoText}>Jira Clone</span>}
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        className={styles.menu}
      />
    </Sider>
  );
};

export default AppSidebar;
