import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Avatar, notification } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { IssueSummary } from '../../types/issue';
import type { ProjectMember } from '../../types/project';

const { TextArea } = Input;
const { Option } = Select;

interface CreateIssueModalProps {
  open: boolean;
  projectId: string;
  members: ProjectMember[];
  onCancel: () => void;
  onSuccess: (newIssue: IssueSummary) => void;
}

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
  const name = fullName?.trim();
  if (name) {
    const parts = name.split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  open,
  projectId,
  members,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload: Record<string, unknown> = {
        title: values.title.trim(),
        priority: values.priority ?? 'MEDIUM',
      };
      if (values.description?.trim()) payload.description = values.description.trim();
      if (values.assigneeId) payload.assigneeId = values.assigneeId;

      const res = await axiosInstance.post<IssueSummary>(
        `/projects/${projectId}/issues`,
        payload,
      );

      notification.success({
        message: 'Issue Created',
        description: `"${values.title.trim()}" was added to the board.`,
        placement: 'topRight',
      });

      form.resetFields();
      onSuccess(res.data);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to create issue.';
      notification.error({
        message: 'Create Failed',
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
          <PlusOutlined style={{ color: '#0052cc', fontSize: 16 }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#172b4d' }}>
            Create Issue
          </span>
        </div>
      }
      footer={null}
      width={540}
      destroyOnClose
    >
      <div style={{ paddingTop: 8 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label={<span style={{ fontWeight: 600, color: '#172b4d' }}>Title</span>}
            rules={[
              { required: true, message: 'Title is required' },
              { min: 3, message: 'Title must be at least 3 characters' },
            ]}
          >
            <Input
              placeholder="What needs to be done?"
              size="large"
              style={{ borderRadius: 6 }}
              maxLength={255}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 600, color: '#172b4d' }}>Description</span>}
          >
            <TextArea
              placeholder="Add a description…"
              rows={4}
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="priority"
              label={<span style={{ fontWeight: 600, color: '#172b4d' }}>Priority</span>}
              initialValue="MEDIUM"
              style={{ flex: 1 }}
            >
              <Select size="large" style={{ borderRadius: 6 }}>
                <Option value="HIGH">
                  <span style={{ color: '#de350b', fontWeight: 600 }}>▲ High</span>
                </Option>
                <Option value="MEDIUM">
                  <span style={{ color: '#ff991f', fontWeight: 600 }}>■ Medium</span>
                </Option>
                <Option value="LOW">
                  <span style={{ color: '#36b37e', fontWeight: 600 }}>▼ Low</span>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="assigneeId"
              label={<span style={{ fontWeight: 600, color: '#172b4d' }}>Assignee</span>}
              style={{ flex: 1 }}
            >
              <Select
                size="large"
                style={{ borderRadius: 6 }}
                placeholder="Unassigned"
                allowClear
                optionLabelProp="label"
              >
                {members.map((m) => (
                  <Option
                    key={m.userId}
                    value={m.userId}
                    label={m.fullName || m.email}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar
                        size={20}
                        style={{
                          backgroundColor: getAvatarColor(m.userId),
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(m.fullName, m.email)}
                      </Avatar>
                      <span>{m.fullName || m.email}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              paddingTop: 8,
              borderTop: '1px solid #f4f5f7',
              marginTop: 4,
            }}
          >
            <Button onClick={handleCancel} disabled={loading} style={{ borderRadius: 6 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<PlusOutlined />}
              style={{
                background: '#0052cc',
                borderColor: '#0052cc',
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Create Issue
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default CreateIssueModal;
