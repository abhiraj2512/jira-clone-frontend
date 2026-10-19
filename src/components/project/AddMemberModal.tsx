import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, notification, Avatar, Spin, Typography } from 'antd';
import { UserAddOutlined, CrownOutlined, CodeOutlined, EyeOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { ProjectRole, ProjectMember } from '../../types/project';

const { Option } = Select;
const { Text } = Typography;

interface RegisteredUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
}

interface AddMemberModalProps {
  open: boolean;
  projectId: string;
  existingMembers: ProjectMember[];
  onCancel: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS: { label: string; value: ProjectRole; description: string; icon: React.ReactNode }[] = [
  {
    label: 'Developer',
    value: 'DEVELOPER',
    description: 'Can view, create and work on issues',
    icon: <CodeOutlined style={{ color: '#006644' }} />,
  },
  {
    label: 'Project Admin',
    value: 'PROJECT_ADMIN',
    description: 'Full access — manage project details and team members',
    icon: <CrownOutlined style={{ color: '#974f0c' }} />,
  },
  {
    label: 'Viewer',
    value: 'VIEWER',
    description: 'Read-only access to project and issues',
    icon: <EyeOutlined style={{ color: '#344563' }} />,
  },
];

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

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  open,
  projectId,
  existingMembers,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState<RegisteredUser[]>([]);

  // Fetch initial list of registered users
  useEffect(() => {
    if (open) {
      loadUsers('');
    }
  }, [open]);

  const loadUsers = async (query: string) => {
    try {
      setSearching(true);
      const res = await axiosInstance.get<RegisteredUser[]>(
        `/users/search${query ? `?query=${encodeURIComponent(query)}` : ''}`
      );
      setUsers(res.data);
    } catch {
      // If /users/search is not reachable, fallback gracefully
      setUsers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (value: string) => {
    loadUsers(value);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      await axiosInstance.post(`/projects/${projectId}/members`, {
        userId: values.userId,
        role: values.role,
      });

      const selectedUser = users.find((u) => u.id === values.userId);
      const roleLabel = ROLE_OPTIONS.find((r) => r.value === values.role)?.label;

      notification.success({
        message: 'Member Added',
        description: `${selectedUser?.fullName || selectedUser?.email || 'User'} has been added to the team as ${roleLabel}.`,
        placement: 'topRight',
      });

      form.resetFields();
      onSuccess();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to add member to the project.';
      notification.error({
        message: 'Action Failed',
        description: Array.isArray(msg) ? msg.join(', ') : msg,
        placement: 'topRight',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const existingUserIds = new Set(existingMembers.map((m) => m.userId));

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserAddOutlined style={{ color: '#0052cc', fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#172b4d' }}>
            Add Team Member
          </span>
        </div>
      }
      footer={null}
      width={520}
      destroyOnClose
    >
      <div style={{ paddingTop: 8 }}>
        <p style={{ color: '#5e6c84', fontSize: 13, marginBottom: 20 }}>
          Select a registered user to grant them access to this project with a designated role.
        </p>

        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ role: 'DEVELOPER' }}>
          <Form.Item
            name="userId"
            label={<span style={{ fontWeight: 600, color: '#172b4d' }}>User</span>}
            rules={[{ required: true, message: 'Please select a user to add' }]}
          >
            <Select
              showSearch
              placeholder="Search by name or email..."
              size="large"
              filterOption={false}
              onSearch={handleSearch}
              notFoundContent={searching ? <Spin size="small" /> : 'No users found'}
              style={{ borderRadius: 6 }}
            >
              {users.map((u) => {
                const isAlreadyMember = existingUserIds.has(u.id);
                const initials = (u.fullName || u.email).slice(0, 2).toUpperCase();
                return (
                  <Option key={u.id} value={u.id} disabled={isAlreadyMember}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar
                          size={24}
                          style={{
                            backgroundColor: getAvatarColor(u.id),
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {initials}
                        </Avatar>
                        <span>
                          <strong>{u.fullName || u.email.split('@')[0]}</strong>{' '}
                          <span style={{ color: '#8993a4', fontSize: 12 }}>({u.email})</span>
                        </span>
                      </div>
                      {isAlreadyMember && (
                        <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>
                          Already a member
                        </Text>
                      )}
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Form.Item
            name="role"
            label={<span style={{ fontWeight: 600, color: '#172b4d' }}>Project Role</span>}
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select size="large" style={{ borderRadius: 6 }}>
              {ROLE_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '2px 0' }}>
                    <span style={{ marginTop: 2 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#172b4d', lineHeight: 1.2 }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: '#8993a4' }}>{opt.description}</div>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              paddingTop: 16,
              borderTop: '1px solid #f4f5f7',
              marginTop: 16,
            }}
          >
            <Button onClick={handleCancel} disabled={submitting} style={{ borderRadius: 6 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<UserAddOutlined />}
              style={{
                background: '#0052cc',
                borderColor: '#0052cc',
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Add to Team
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default AddMemberModal;
