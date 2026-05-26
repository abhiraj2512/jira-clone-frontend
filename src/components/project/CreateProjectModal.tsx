import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import axiosInstance from '../../api/axios';
import styles from './CreateProjectModal.module.css';

interface CreateProjectModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleFinish = async (values: { name: string; key: string; description?: string }) => {
    try {
      setLoading(true);
      await axiosInstance.post('/projects', values);
      message.success('Project created successfully');
      form.resetFields();
      
      // Dispatch custom event to let components like Dashboard know they should refresh
      window.dispatchEvent(new Event('project-created'));
      
      if (onSuccess) {
        onSuccess();
      }
      onCancel();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Project"
      open={open}
      onOk={() => form.submit()}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      okText="Create"
      cancelText="Cancel"
      wrapClassName={styles.modalWrapper}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className={styles.form}
      >
        <Form.Item
          name="name"
          label="Project Name"
          rules={[{ required: true, message: 'Please enter project name' }]}
        >
          <Input placeholder="E.g., Engineering Team" className={styles.input} />
        </Form.Item>
        
        <Form.Item
          name="key"
          label="Project Key"
          rules={[
            { required: true, message: 'Please enter project key' },
            { max: 10, message: 'Key cannot be longer than 10 characters' }
          ]}
        >
          <Input 
            placeholder="E.g., ENG" 
            className={styles.input}
            style={{ textTransform: 'uppercase' }} 
            onChange={(e) => {
              form.setFieldsValue({ key: e.target.value.toUpperCase() });
            }} 
          />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea placeholder="Project description (optional)" rows={3} className={styles.input} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateProjectModal;
