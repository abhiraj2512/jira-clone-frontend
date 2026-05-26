import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import axiosInstance from '../../api/axios';
import type { Project } from '../../types/project';
import styles from './EditProjectModal.module.css';

interface EditProjectModalProps {
  open: boolean;
  project: Project;
  onCancel: () => void;
  onSuccess: (updatedProject: Project) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ open, project, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && project) {
      form.setFieldsValue({
        name: project.name,
        key: project.key,
        description: project.description || '',
      });
    }
  }, [open, project, form]);

  const handleFinish = async (values: { name: string; key: string; description?: string }) => {
    try {
      setLoading(true);
      const response = await axiosInstance.patch<Project>(`/projects/${project.id}`, values);
      message.success('Project updated successfully');
      onSuccess(response.data);
      onCancel();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Project Details"
      open={open}
      onOk={() => form.submit()}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Save Changes"
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

export default EditProjectModal;
