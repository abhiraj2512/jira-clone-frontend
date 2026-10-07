import React, { useState } from 'react';
import { Modal, Form, Input, Button, DatePicker, notification } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import axiosInstance from '../../api/axios';
import type { Sprint, CreateSprintInput } from '../../types/sprint';

const { TextArea } = Input;

interface CreateSprintModalProps {
  open: boolean;
  projectId: string;
  onCancel: () => void;
  onSuccess: (sprint: Sprint) => void;
}

const CreateSprintModal: React.FC<CreateSprintModalProps> = ({
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

      const startDate: Dayjs | undefined = values.startDate;
      const endDate: Dayjs | undefined = values.endDate;

      if (startDate && endDate && endDate.isBefore(startDate)) {
        notification.error({
          message: 'Invalid Dates',
          description: 'End date must not be before start date.',
          placement: 'topRight',
        });
        return;
      }

      const payload: CreateSprintInput = {
        name: values.name.trim(),
      };
      if (values.goal?.trim()) payload.goal = values.goal.trim();
      if (startDate) payload.startDate = startDate.format('YYYY-MM-DD');
      if (endDate) payload.endDate = endDate.format('YYYY-MM-DD');

      const res = await axiosInstance.post<Sprint>(
        `/projects/${projectId}/sprints`,
        payload,
      );

      notification.success({
        message: 'Sprint Created',
        description: `"${res.data.name}" has been created as PLANNED.`,
        placement: 'topRight',
      });

      form.resetFields();
      onSuccess(res.data);
    } catch (err: any) {
      if (err?.errorFields) return; // form validation error, already shown
      const msg = err.response?.data?.message || err.message || 'Failed to create sprint.';
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
          <ThunderboltOutlined style={{ color: '#0052cc', fontSize: 16 }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#172b4d' }}>
            Create Sprint
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
            name="name"
            label={<span style={{ fontWeight: 600, color: '#172b4d' }}>Sprint Name *</span>}
            rules={[
              { required: true, message: 'Sprint name is required' },
              { min: 1, message: 'Name cannot be empty' },
              { max: 255, message: 'Name must not exceed 255 characters' },
            ]}
          >
            <Input
              placeholder="e.g. Sprint 1"
              size="large"
              style={{ borderRadius: 6 }}
              maxLength={255}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="goal"
            label={<span style={{ fontWeight: 600, color: '#172b4d' }}>Sprint Goal</span>}
          >
            <TextArea
              placeholder="What is the goal of this sprint?"
              rows={3}
              style={{ borderRadius: 6 }}
              maxLength={1000}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="startDate"
              label={<span style={{ fontWeight: 600, color: '#172b4d' }}>Start Date</span>}
              style={{ flex: 1 }}
            >
              <DatePicker
                style={{ width: '100%', borderRadius: 6 }}
                size="large"
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <Form.Item
              name="endDate"
              label={<span style={{ fontWeight: 600, color: '#172b4d' }}>End Date</span>}
              style={{ flex: 1 }}
            >
              <DatePicker
                style={{ width: '100%', borderRadius: 6 }}
                size="large"
                format="YYYY-MM-DD"
              />
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
              style={{
                background: '#0052cc',
                borderColor: '#0052cc',
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Create Sprint
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default CreateSprintModal;
