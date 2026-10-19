import React, { useState, useMemo } from 'react';
import {
  Table,
  Input,
  Button,
  Tag,
  Select,
  Popconfirm,
  Modal,
  Avatar,
  Tooltip,
  message,
  notification,
  Empty,
  Typography,
} from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  SearchOutlined,
  DeleteOutlined,
  CrownOutlined,
  CodeOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '../../api/axios';
import type { ProjectMember, ProjectRole } from '../../types/project';
import AddMemberModal from './AddMemberModal';
import styles from './TeamManagementSection.module.css';

const { Text } = Typography;
const { Option } = Select;

interface TeamManagementSectionProps {
  projectId: string;
  members: ProjectMember[];
  loading: boolean;
  myRole: ProjectRole | null;
  currentUserId: string;
  onRefresh: () => void;
}

const ROLE_CONFIG: Record<
  ProjectRole,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  PROJECT_ADMIN: {
    label: 'Project Admin',
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

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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

const TeamManagementSection: React.FC<TeamManagementSectionProps> = ({
  projectId,
  members,
  loading,
  myRole,
  currentUserId,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const isAdmin = myRole === 'PROJECT_ADMIN';

  // Count current admins
  const adminCount = useMemo(
    () => members.filter((m) => m.role === 'PROJECT_ADMIN').length,
    [members]
  );
  const devCount = useMemo(
    () => members.filter((m) => m.role === 'DEVELOPER').length,
    [members]
  );
  const viewerCount = useMemo(
    () => members.filter((m) => m.role === 'VIEWER').length,
    [members]
  );

  // Filtered members based on client search
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.trim().toLowerCase();
    return members.filter(
      (m) =>
        (m.fullName && m.fullName.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
  }, [members, search]);

  // Handle Role Change with confirmation
  const handleRoleChange = (member: ProjectMember, newRole: ProjectRole) => {
    if (member.role === newRole) return;

    // Safety check: Cannot demote the last Project Admin
    if (member.role === 'PROJECT_ADMIN' && newRole !== 'PROJECT_ADMIN' && adminCount <= 1) {
      message.error('Cannot change the role of the only Project Admin. A project must have at least one Project Admin.');
      return;
    }

    const memberName = member.fullName || member.email;
    const oldRoleLabel = ROLE_CONFIG[member.role]?.label || member.role;
    const newRoleLabel = ROLE_CONFIG[newRole]?.label || newRole;

    Modal.confirm({
      title: 'Change Member Role',
      icon: <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />,
      content: `Are you sure you want to change ${memberName}'s role from ${oldRoleLabel} to ${newRoleLabel}?`,
      okText: 'Yes, Change Role',
      cancelText: 'Cancel',
      onOk: async () => {
        const identifier = member.id || member.userId;
        try {
          setUpdatingMemberId(member.userId);
          await axiosInstance.patch(`/projects/${projectId}/members/${identifier}`, {
            role: newRole,
          });
          notification.success({
            message: 'Role Updated',
            description: `${memberName}'s role is now ${newRoleLabel}.`,
            placement: 'topRight',
          });
          onRefresh();
        } catch (err: any) {
          const msg = err.response?.data?.message || err.message || 'Failed to update role';
          notification.error({
            message: 'Update Failed',
            description: Array.isArray(msg) ? msg.join(', ') : msg,
            placement: 'topRight',
          });
        } finally {
          setUpdatingMemberId(null);
        }
      },
    });
  };

  // Handle Remove Member
  const handleRemoveMember = async (member: ProjectMember) => {
    if (member.role === 'PROJECT_ADMIN' && adminCount <= 1) {
      message.error('Cannot remove the only Project Admin. A project must have at least one Project Admin.');
      return;
    }

    const identifier = member.id || member.userId;
    try {
      setRemovingMemberId(member.userId);
      await axiosInstance.delete(`/projects/${projectId}/members/${identifier}`);
      notification.success({
        message: 'Member Removed',
        description: `${member.fullName || member.email} has been removed from the project.`,
        placement: 'topRight',
      });
      onRefresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove member';
      notification.error({
        message: 'Removal Failed',
        description: Array.isArray(msg) ? msg.join(', ') : msg,
        placement: 'topRight',
      });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const columns: ColumnsType<ProjectMember> = [
    {
      title: 'Member',
      dataIndex: 'fullName',
      key: 'member',
      render: (_: any, record: ProjectMember) => {
        const initials = getInitials(record.fullName, record.email);
        const avatarColor = getAvatarColor(record.userId);
        const isCurrentUser = record.userId === currentUserId;
        const displayName = record.fullName || record.email.split('@')[0];

        return (
          <div className={styles.memberCell}>
            <Tooltip title={record.email}>
              <Avatar
                size={38}
                style={{
                  backgroundColor: avatarColor,
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {initials}
              </Avatar>
            </Tooltip>
            <div className={styles.memberInfo}>
              <div className={styles.memberName}>
                {displayName}
                {isCurrentUser && <span className={styles.youBadge}>You</span>}
              </div>
              <div className={styles.memberEmail}>{record.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 200,
      render: (role: ProjectRole, record: ProjectMember) => {
        const config = ROLE_CONFIG[role];
        const isOnlyAdmin = role === 'PROJECT_ADMIN' && adminCount <= 1;

        if (isAdmin) {
          return (
            <Select
              value={role}
              size="middle"
              className={styles.roleSelect}
              loading={updatingMemberId === record.userId}
              disabled={updatingMemberId === record.userId}
              onChange={(newRole) => handleRoleChange(record, newRole)}
            >
              <Option value="PROJECT_ADMIN" disabled={isOnlyAdmin}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CrownOutlined style={{ color: '#974f0c' }} />
                  <span>Admin</span>
                </div>
              </Option>
              <Option
                value="DEVELOPER"
                disabled={isOnlyAdmin}
                title={isOnlyAdmin ? 'Cannot demote the only Project Admin' : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CodeOutlined style={{ color: '#006644' }} />
                  <span>Developer</span>
                </div>
              </Option>
              <Option
                value="VIEWER"
                disabled={isOnlyAdmin}
                title={isOnlyAdmin ? 'Cannot demote the only Project Admin' : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <EyeOutlined style={{ color: '#344563' }} />
                  <span>Viewer</span>
                </div>
              </Option>
            </Select>
          );
        }

        return (
          <Tag
            icon={config.icon}
            style={{
              color: config.color,
              backgroundColor: config.bg,
              border: 'none',
              fontWeight: 600,
              fontSize: 12,
              padding: '3px 10px',
              borderRadius: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (val: string | undefined) => {
        if (!val) return <Text type="secondary">—</Text>;
        try {
          const date = new Date(val);
          return (
            <span style={{ color: '#5e6c84', fontSize: 13 }}>
              {date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          );
        } catch {
          return <Text type="secondary">—</Text>;
        }
      },
    },
    ...(isAdmin
      ? [
          {
            title: 'Actions',
            key: 'actions',
            width: 110,
            render: (_: any, record: ProjectMember) => {
              const isOnlyAdmin = record.role === 'PROJECT_ADMIN' && adminCount <= 1;

              if (isOnlyAdmin) {
                return (
                  <Tooltip title="Cannot remove the only Project Admin">
                    <Button
                      type="text"
                      danger
                      disabled
                      size="small"
                      icon={<DeleteOutlined />}
                    >
                      Remove
                    </Button>
                  </Tooltip>
                );
              }

              return (
                <Popconfirm
                  title="Remove Member"
                  description={`Are you sure you want to remove ${
                    record.fullName || record.email
                  } from this project?`}
                  onConfirm={() => handleRemoveMember(record)}
                  okText="Yes, Remove"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true, loading: removingMemberId === record.userId }}
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={removingMemberId === record.userId}
                  >
                    Remove
                  </Button>
                </Popconfirm>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div>
            <h3 className={styles.title}>
              <TeamOutlined style={{ color: '#0052cc' }} />
              Team Members
            </h3>
            <p className={styles.subtitle}>
              Manage project collaborators and configure role-based access permissions.
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setAddModalOpen(true)}
            style={{
              background: '#0052cc',
              borderColor: '#0052cc',
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            Add Member
          </Button>
        )}
      </div>

      {/* Summary stats */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span>Total Members:</span>
          <span className={styles.statCount}>{members.length}</span>
        </div>
        <div style={{ color: '#dfe1e6' }}>|</div>
        <div className={styles.statItem}>
          <CrownOutlined style={{ color: '#974f0c' }} />
          <span>Admins:</span>
          <span className={styles.statCount}>{adminCount}</span>
        </div>
        <div style={{ color: '#dfe1e6' }}>|</div>
        <div className={styles.statItem}>
          <CodeOutlined style={{ color: '#006644' }} />
          <span>Developers:</span>
          <span className={styles.statCount}>{devCount}</span>
        </div>
        <div style={{ color: '#dfe1e6' }}>|</div>
        <div className={styles.statItem}>
          <EyeOutlined style={{ color: '#344563' }} />
          <span>Viewers:</span>
          <span className={styles.statCount}>{viewerCount}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Input
          prefix={<SearchOutlined style={{ color: '#8993a4' }} />}
          placeholder="Search members by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className={styles.searchInput}
          size="middle"
        />
        {search && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            Showing {filteredMembers.length} of {members.length} members
          </Text>
        )}
      </div>

      {/* Table */}
      <Table
        dataSource={filteredMembers}
        columns={columns}
        rowKey="userId"
        loading={loading}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        locale={{
          emptyText: search ? (
            <div className={styles.emptyState}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    No members match "<strong>{search}</strong>"
                  </span>
                }
              >
                <Button size="small" onClick={() => setSearch('')}>
                  Clear Search
                </Button>
              </Empty>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No team members yet."
              />
            </div>
          ),
        }}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        open={addModalOpen}
        projectId={projectId}
        existingMembers={members}
        onCancel={() => setAddModalOpen(false)}
        onSuccess={() => {
          setAddModalOpen(false);
          onRefresh();
        }}
      />
    </div>
  );
};

export default TeamManagementSection;
