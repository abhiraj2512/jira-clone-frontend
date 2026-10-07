import React, { useState } from 'react';
import { Modal, Button, notification, Statistic, Row, Col, Alert } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { Sprint, CompleteSprintResponse } from '../../types/sprint';

interface CompleteSprintModalProps {
  open: boolean;
  sprint: Sprint;
  onCancel: () => void;
  onSuccess: (result: CompleteSprintResponse) => void;
}

const CompleteSprintModal: React.FC<CompleteSprintModalProps> = ({
  open,
  sprint,
  onCancel,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const incompleteCount = sprint.issueCount - sprint.completedIssueCount;

  const handleComplete = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post<CompleteSprintResponse>(
        `/sprints/${sprint.id}/complete`,
      );

      notification.success({
        message: 'Sprint Completed',
        description: `"${sprint.name}" has been completed. ${res.data.movedToBacklogCount} issue(s) moved back to backlog.`,
        placement: 'topRight',
      });

      onSuccess(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to complete sprint.';
      notification.error({
        message: 'Complete Failed',
        description: Array.isArray(msg) ? msg.join(', ') : msg,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircleOutlined style={{ color: '#00875a', fontSize: 16 }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#172b4d' }}>
            Complete Sprint
          </span>
        </div>
      }
      footer={null}
      width={480}
      destroyOnClose
    >
      <div style={{ padding: '8px 0' }}>
        <p style={{ color: '#172b4d', marginBottom: 20, fontSize: 14 }}>
          Are you sure you want to complete{' '}
          <strong>{sprint.name}</strong>?
        </p>

        <Row gutter={24} style={{ marginBottom: 20 }}>
          <Col span={12}>
            <div
              style={{
                background: '#e3fcef',
                borderRadius: 8,
                padding: '12px 16px',
                textAlign: 'center',
              }}
            >
              <Statistic
                title={
                  <span style={{ color: '#006644', fontWeight: 600, fontSize: 12 }}>
                    <CheckCircleOutlined style={{ marginRight: 4 }} />
                    Done
                  </span>
                }
                value={sprint.completedIssueCount}
                valueStyle={{ color: '#00875a', fontSize: 24, fontWeight: 700 }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div
              style={{
                background: '#fff4e5',
                borderRadius: 8,
                padding: '12px 16px',
                textAlign: 'center',
              }}
            >
              <Statistic
                title={
                  <span style={{ color: '#974f0c', fontWeight: 600, fontSize: 12 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    Incomplete
                  </span>
                }
                value={incompleteCount}
                valueStyle={{ color: '#ff8b00', fontSize: 24, fontWeight: 700 }}
              />
            </div>
          </Col>
        </Row>

        {incompleteCount > 0 && (
          <Alert
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
            message={
              <span style={{ fontSize: 13 }}>
                <strong>{incompleteCount}</strong> incomplete issue
                {incompleteCount !== 1 ? 's' : ''} (To Do &amp; In Progress) will be{' '}
                <strong>moved back to the backlog</strong>.
              </span>
            }
            description="Done issues will remain in this completed sprint for reference."
          />
        )}

        {incompleteCount === 0 && (
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
            message="All issues are done! Great sprint!"
          />
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            paddingTop: 8,
            borderTop: '1px solid #f4f5f7',
          }}
        >
          <Button onClick={onCancel} disabled={loading} style={{ borderRadius: 6 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleComplete}
            style={{
              background: '#00875a',
              borderColor: '#00875a',
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            Complete Sprint
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CompleteSprintModal;
