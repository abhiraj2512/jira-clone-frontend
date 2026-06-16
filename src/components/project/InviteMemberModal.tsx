import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, notification } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { ProjectRole } from '../../types/project';

interface InviteMemberModalProps {
  open: boolean;
  projectId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const { Option } = Select;

const ROLE_OPTIONS: { label: string; value: ProjectRole; description: string }[] = [
  {
    label: 'Project Admin',
    value: 'PROJECT_ADMIN',
    description: 'Full access — edit, delete, invite members',
  },
  {
    label: 'Developer',
    value: 'DEVELOPER',
    description: 'Can view & work on issues',
  },
  {
    label: 'Viewer',
    value: 'VIEWER',
    description: 'Read-only access',
  },
];

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  open,
  projectId,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Step 1: Resolve email → userId
      const userRes = await axiosInstance.get<{ id: string; email: string; fullName: string }>(
        `/users/by-email?email=${encodeURIComponent(values.email.trim())}`
      );
      const { id: userId } = userRes.data;

      // Step 2: Add member to project
      await axiosInstance.post(`/projects/${projectId}/members`, {
        userId,
        role: values.role,
      });

      notification.success({
        message: 'Member Invited',
        description: `${values.email} has been added to the project as ${
          ROLE_OPTIONS.find((r) => r.value === values.role)?.label
        }.`,
        placement: 'topRight',
      });

      form.resetFields();
      onSuccess();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to invite member. Please try again.';
      notification.error({
        message: 'Invite Failed',
        description: Array.isArray(msg) ? msg.join(', ') : msg,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserAddOutlined style={{ color: '#0052cc', fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#172b4d' }}>
            Invite Team Member
          </span>
        </div>
      }
      footer={null}
      width={480}
      destroyOnClose
    >
      <div style={{ padding: '8px 0 0' }}>
        <p style={{ color: '#5e6c84', fontSize: 13, marginBottom: 24 }}>
          Enter the email address of the person you want to invite. They must have a registered
          account.
        </p>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 600, color: '#172b4d' }}>Email Address</span>}
            rules={[
              { required: true, message: 'Please enter an email address' },
              { type: 'email', message: 'Please enter a valid email address' },
            ]}
          >
            <Input
              placeholder="colleague@example.com"
              size="large"
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            name="role"
            label={<span style={{ fontWeight: 600, color: '#172b4d' }}>Role</span>}
            initialValue="DEVELOPER"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select size="large" style={{ borderRadius: 6 }}>
              {ROLE_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#172b4d' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#8993a4' }}>{opt.description}</div>
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
              paddingTop: 8,
              borderTop: '1px solid #f4f5f7',
              marginTop: 8,
            }}
          >
            <Button onClick={handleCancel} disabled={loading} style={{ borderRadius: 6 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<UserAddOutlined />}
              style={{
                background: '#0052cc',
                borderColor: '#0052cc',
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Send Invite
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default InviteMemberModal;
