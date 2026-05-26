import React, { useState } from 'react';
import { Layout, Button, Avatar, Tooltip, Popover } from 'antd';
import { LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CreateProjectModal from '../project/CreateProjectModal';
import styles from './AppHeader.module.css';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getAvatarColor = (email: string) => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#0052cc', // Jira Blue
      '#00875a', // Green
      '#de350b', // Red-Orange
      '#ff991f', // Orange
      '#5243aa', // Purple
      '#00b8d9', // Teal
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const email = user?.email || '';
  const initial = email ? email.charAt(0).toUpperCase() : 'U';
  const avatarBg = email ? getAvatarColor(email) : '#0052cc';

  const userMenuContent = (
    <div className={styles.userMenu}>
      <div className={styles.userInfo}>
        <Avatar style={{ backgroundColor: avatarBg }} size={40}>
          {initial}
        </Avatar>
        <div className={styles.userDetails}>
          <span className={styles.userEmail}>{email}</span>
          <span className={styles.userRole}>Software Engineer</span>
        </div>
      </div>
      <div className={styles.menuDivider} />
      <Button 
        type="text" 
        danger 
        icon={<LogoutOutlined />} 
        onClick={handleLogout}
        className={styles.logoutBtn}
        block
      >
        Log out
      </Button>
    </div>
  );

  return (
    <Header className={styles.header} id="app-header">
      <div className={styles.leftSection}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setModalOpen(true)}
          className={styles.createBtn}
        >
          Create Project
        </Button>
      </div>

      <div className={styles.rightSection}>
        <span className={styles.emailText}>{email}</span>
        <Popover content={userMenuContent} trigger="click" placement="bottomRight" arrow={false}>
          <Tooltip title="Profile settings" placement="bottom">
            <Avatar 
              style={{ backgroundColor: avatarBg, cursor: 'pointer' }} 
              size={36}
              className={styles.avatar}
            >
              {initial}
            </Avatar>
          </Tooltip>
        </Popover>
      </div>

      <CreateProjectModal open={modalOpen} onCancel={() => setModalOpen(false)} />
    </Header>
  );
};

export default AppHeader;
