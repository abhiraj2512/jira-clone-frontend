import React, { useState } from 'react';
import {
  Button,
  Tag,
  Progress,
  Tooltip,
  Popconfirm,
  notification,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  CalendarOutlined,
  FlagOutlined,
  EditOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { Sprint, CompleteSprintResponse } from '../../types/sprint';
import type { ProjectRole } from '../../types/project';
import { SPRINT_STATUS_CONFIG } from '../../types/sprint';
import CompleteSprintModal from './CompleteSprintModal';
import styles from './SprintCard.module.css';

interface SprintCardProps {
  sprint: Sprint;
  myRole: ProjectRole | null;
  onSprintUpdated: (sprint: Sprint) => void;
  onSprintDeleted: (sprintId: string) => void;
  onSprintCompleted: (result: CompleteSprintResponse) => void;
  onViewBoard?: (sprint: Sprint) => void;
  onEditSprint?: (sprint: Sprint) => void;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const SprintCard: React.FC<SprintCardProps> = ({
  sprint,
  myRole,
  onSprintUpdated,
  onSprintDeleted,
  onSprintCompleted,
  onViewBoard,
  onEditSprint,
}) => {
  const [startingLoading, setStartingLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  const isAdmin = myRole === 'PROJECT_ADMIN';
  const statusCfg = SPRINT_STATUS_CONFIG[sprint.status];

  const handleStartSprint = async () => {
    try {
      setStartingLoading(true);
      const res = await axiosInstance.post<Sprint>(`/sprints/${sprint.id}/start`);
      notification.success({
        message: 'Sprint Started',
        description: `"${sprint.name}" is now active!`,
        placement: 'topRight',
      });
      onSprintUpdated(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to start sprint.';
      notification.error({ message: 'Error', description: msg, placement: 'topRight' });
    } finally {
      setStartingLoading(false);
    }
  };

  const handleDeleteSprint = async () => {
    try {
      setDeleteLoading(true);
      await axiosInstance.delete(`/sprints/${sprint.id}`);
      notification.success({
        message: 'Sprint Deleted',
        description: `"${sprint.name}" was deleted.`,
        placement: 'topRight',
      });
      onSprintDeleted(sprint.id);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete sprint.';
      notification.error({ message: 'Error', description: msg, placement: 'topRight' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCompleteSuccess = (result: CompleteSprintResponse) => {
    setCompleteModalOpen(false);
    onSprintCompleted(result);
  };

  return (
    <div
      className={`${styles.card} ${
        sprint.status === 'ACTIVE' ? styles.cardActive : ''
      } ${sprint.status === 'COMPLETED' ? styles.cardCompleted : ''}`}
    >
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.titleRow}>
          <span className={styles.sprintName}>{sprint.name}</span>
          <Tag
            className={styles.statusTag}
            style={{
              color: statusCfg.color,
              background: statusCfg.bg,
              border: `1px solid ${statusCfg.borderColor}`,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            {statusCfg.label}
          </Tag>
        </div>

        {/* Actions */}
        {isAdmin && (
          <div className={styles.actions}>
            {sprint.status === 'PLANNED' && (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  loading={startingLoading}
                  onClick={handleStartSprint}
                  style={{
                    background: '#00875a',
                    borderColor: '#00875a',
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Start Sprint
                </Button>
                {onEditSprint && (
                  <Tooltip title="Edit sprint">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => onEditSprint(sprint)}
                      style={{ borderRadius: 6 }}
                    />
                  </Tooltip>
                )}
                <Popconfirm
                  title="Delete Sprint"
                  description={`Delete "${sprint.name}"? Issues will move to backlog.`}
                  onConfirm={handleDeleteSprint}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true, loading: deleteLoading }}
                >
                  <Tooltip title="Delete sprint">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      style={{ borderRadius: 6 }}
                    />
                  </Tooltip>
                </Popconfirm>
              </>
            )}

            {sprint.status === 'ACTIVE' && (
              <>
                {onViewBoard && (
                  <Button
                    size="small"
                    onClick={() => onViewBoard(sprint)}
                    style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}
                  >
                    View Board
                  </Button>
                )}
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setCompleteModalOpen(true)}
                  style={{
                    background: '#0052cc',
                    borderColor: '#0052cc',
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Complete Sprint
                </Button>
              </>
            )}

            {sprint.status === 'COMPLETED' && (
              <Tag
                style={{
                  color: '#5e6c84',
                  background: '#f4f5f7',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 11,
                }}
              >
                Sprint Completed
              </Tag>
            )}
          </div>
        )}

        {/* Non-admin: view board for active */}
        {!isAdmin && sprint.status === 'ACTIVE' && onViewBoard && (
          <Button
            size="small"
            onClick={() => onViewBoard(sprint)}
            style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}
          >
            View Board
          </Button>
        )}
      </div>

      {/* Goal */}
      {sprint.goal && (
        <div className={styles.goal}>
          <FlagOutlined className={styles.goalIcon} />
          <span>{sprint.goal}</span>
        </div>
      )}

      {/* Dates */}
      <div className={styles.dates}>
        <CalendarOutlined style={{ color: '#5e6c84', marginRight: 4 }} />
        <span className={styles.dateLabel}>
          {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
        </span>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <Row gutter={16}>
          <Col>
            <Statistic
              title="Issues"
              value={sprint.issueCount}
              valueStyle={{ fontSize: 18, fontWeight: 700, color: '#172b4d' }}
            />
          </Col>
          <Col>
            <Statistic
              title="Done"
              value={sprint.completedIssueCount}
              valueStyle={{ fontSize: 18, fontWeight: 700, color: '#00875a' }}
            />
          </Col>
          <Col>
            <Statistic
              title="Completion"
              value={sprint.completionPercentage}
              suffix="%"
              valueStyle={{ fontSize: 18, fontWeight: 700, color: '#0052cc' }}
            />
          </Col>
        </Row>
      </div>

      {/* Progress bar */}
      {sprint.issueCount > 0 && (
        <div className={styles.progressSection}>
          <Progress
            percent={sprint.completionPercentage}
            strokeColor={{ '0%': '#0052cc', '100%': '#00875a' }}
            trailColor="#ebecf0"
            showInfo={false}
            strokeWidth={6}
            style={{ margin: 0 }}
          />
        </div>
      )}

      {completeModalOpen && (
        <CompleteSprintModal
          open={completeModalOpen}
          sprint={sprint}
          onCancel={() => setCompleteModalOpen(false)}
          onSuccess={handleCompleteSuccess}
        />
      )}
    </div>
  );
};

export default SprintCard;
