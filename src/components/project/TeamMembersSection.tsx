import React from 'react';
import { Avatar, Skeleton, Tag, Tooltip, Empty } from 'antd';
import {
  CrownOutlined,
  CodeOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ProjectMember, ProjectRole } from '../../types/project';
import styles from './TeamMembersSection.module.css';

interface TeamMembersSectionProps {
  members: ProjectMember[];
  loading: boolean;
  currentUserId: string;
}

const ROLE_CONFIG: Record<
  ProjectRole,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  PROJECT_ADMIN: {
    label: 'Admin',
    color: '#974f0c',
    bg: '#fff7e6',
    icon: <CrownOutlined />,
  },
  DEVELOPER: {
    label: 'Developer',
    color: '#006644',
    bg: '#e3fcef',
    icon: <CodeOutlined />,
  },
  VIEWER: {
    label: 'Viewer',
    color: '#344563',
    bg: '#ebecf0',
    icon: <EyeOutlined />,
  },
};

const AVATAR_COLORS = [
  '#0052cc', '#5243aa', '#00875a', '#de350b',
  '#ff5630', '#6554c0', '#00b8d9', '#36b37e',
];

function getInitials(fullName: string, email: string): string {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.trim().slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const TeamMembersSection: React.FC<TeamMembersSectionProps> = ({
  members,
  loading,
  currentUserId,
}) => {
  if (loading) {
    return (
      <div className={styles.membersList}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.memberRow}>
            <Skeleton.Avatar active size={40} />
            <div className={styles.memberInfo}>
              <Skeleton.Input active size="small" style={{ width: 140, marginBottom: 4 }} />
              <Skeleton.Input active size="small" style={{ width: 100 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!members.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span style={{ color: '#8993a4', fontSize: 13 }}>
            No members yet. Invite your first teammate!
          </span>
        }
        style={{ padding: '16px 0' }}
      />
    );
  }

  return (
    <div className={styles.membersList}>
      {members.map((member) => {
        const config = ROLE_CONFIG[member.role];
        const initials = getInitials(member.fullName, member.email);
        const avatarColor = getAvatarColor(member.userId);
        const isCurrentUser = member.userId === currentUserId;
        const displayName = member.fullName || member.email.split('@')[0];

        return (
          <div key={member.userId} className={styles.memberRow}>
            <Tooltip title={member.email}>
              <Avatar
                size={40}
                style={{ backgroundColor: avatarColor, fontWeight: 700, fontSize: 14, flexShrink: 0 }}
              >
                {initials}
              </Avatar>
            </Tooltip>

            <div className={styles.memberInfo}>
              <div className={styles.memberName}>
                {displayName}
                {isCurrentUser && (
                  <span className={styles.youBadge}>You</span>
                )}
              </div>
              <div className={styles.memberEmail}>{member.email}</div>
            </div>

            <Tag
              icon={config.icon}
              style={{
                color: config.color,
                backgroundColor: config.bg,
                border: 'none',
                fontWeight: 600,
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {config.label}
            </Tag>
          </div>
        );
      })}
    </div>
  );
};

export default TeamMembersSection;
