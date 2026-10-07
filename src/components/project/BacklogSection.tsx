import React, { useState, useCallback } from 'react';
import {
  Select,
  Tag,
  Avatar,
  Tooltip,
  Skeleton,
  Empty,
  notification,
} from 'antd';
import {
  InboxOutlined,
  ArrowUpOutlined,
  MinusOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { IssueSummary, IssuePriority } from '../../types/issue';
import type { Sprint } from '../../types/sprint';
import type { ProjectMember, ProjectRole } from '../../types/project';
import styles from './BacklogSection.module.css';

const { Option } = Select;

interface BacklogSectionProps {
  issues: IssueSummary[];
  sprints: Sprint[];
  members: ProjectMember[];
  myRole: ProjectRole | null;
  loading: boolean;
  projectKey: string;
  onIssueClick: (issue: IssueSummary) => void;
  onIssueSprintChanged: (issueId: string, sprintId: string | null) => void;
}

const PRIORITY_ICON: Record<IssuePriority, React.ReactNode> = {
  HIGH:   <ArrowUpOutlined />,
  MEDIUM: <MinusOutlined />,
  LOW:    <ArrowDownOutlined />,
};

const PRIORITY_COLOR: Record<IssuePriority, string> = {
  HIGH:   '#de350b',
  MEDIUM: '#ff8b00',
  LOW:    '#36b37e',
};

const PRIORITY_BG: Record<IssuePriority, string> = {
  HIGH:   '#ffebe6',
  MEDIUM: '#fff4e5',
  LOW:    '#e3fcef',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  TODO:        { label: 'To Do',       color: '#42526e', bg: '#ebecf0' },
  IN_PROGRESS: { label: 'In Progress', color: '#0052cc', bg: '#deebff' },
  DONE:        { label: 'Done',        color: '#00875a', bg: '#e3fcef' },
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
  const name = fullName?.trim();
  if (name) {
    const parts = name.split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

const BacklogSection: React.FC<BacklogSectionProps> = ({
  issues,
  sprints,
  members,
  myRole,
  loading,
  projectKey,
  onIssueClick,
  onIssueSprintChanged,
}) => {
  const [assigningSprintFor, setAssigningSprintFor] = useState<string | null>(null);

  const canModify = myRole === 'PROJECT_ADMIN' || myRole === 'DEVELOPER';

  // Only show PLANNED and ACTIVE sprints as assignment targets
  const eligibleSprints = sprints.filter(
    (s) => s.status === 'PLANNED' || s.status === 'ACTIVE',
  );

  const handleSprintAssign = useCallback(
    async (issueId: string, sprintId: string | null) => {
      setAssigningSprintFor(issueId);
      try {
        await axiosInstance.patch(`/issues/${issueId}/sprint`, { sprintId });
        onIssueSprintChanged(issueId, sprintId);
        if (sprintId) {
          const sprint = sprints.find((s) => s.id === sprintId);
          notification.success({
            message: 'Added to Sprint',
            description: `Issue moved to "${sprint?.name || 'sprint'}"`,
            placement: 'topRight',
          });
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to update sprint assignment.';
        notification.error({ message: 'Error', description: msg, placement: 'topRight' });
      } finally {
        setAssigningSprintFor(null);
      }
    },
    [sprints, onIssueSprintChanged],
  );

  if (loading) {
    return (
      <div className={styles.wrapper}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonRow}>
            <Skeleton active paragraph={{ rows: 1 }} title={false} />
          </div>
        ))}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className={styles.emptyWrapper}>
        <Empty
          image={<InboxOutlined style={{ fontSize: 40, color: '#c1c7d0' }} />}
          imageStyle={{ height: 48 }}
          description={
            <span style={{ color: '#8993a4', fontSize: 13 }}>
              No issues in backlog
            </span>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableHeader}>
        <span className={styles.thKey}>Key</span>
        <span className={styles.thTitle}>Title</span>
        <span className={styles.thStatus}>Status</span>
        <span className={styles.thPriority}>Priority</span>
        <span className={styles.thAssignee}>Assignee</span>
        {canModify && <span className={styles.thSprint}>Move to Sprint</span>}
      </div>

      {issues.map((issue) => {
        const assignee = issue.assigneeId
          ? members.find((m) => m.userId === issue.assigneeId)
          : null;
        const statusCfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG['TODO'];
        const issueKey = `${projectKey}-${shortId(issue.id)}`;
        const isAssigning = assigningSprintFor === issue.id;

        return (
          <div key={issue.id} className={styles.issueRow}>
            <span className={styles.cellKey} onClick={() => onIssueClick(issue)}>
              {issueKey}
            </span>

            <span
              className={styles.cellTitle}
              onClick={() => onIssueClick(issue)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onIssueClick(issue)}
            >
              {issue.title}
            </span>

            <span className={styles.cellStatus}>
              <Tag
                style={{
                  color: statusCfg.color,
                  background: statusCfg.bg,
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  margin: 0,
                }}
              >
                {statusCfg.label}
              </Tag>
            </span>

            <span className={styles.cellPriority}>
              <span
                style={{
                  color: PRIORITY_COLOR[issue.priority],
                  backgroundColor: PRIORITY_BG[issue.priority],
                  borderRadius: 4,
                  padding: '2px 7px',
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                {PRIORITY_ICON[issue.priority]}
                <span>{issue.priority}</span>
              </span>
            </span>

            <span className={styles.cellAssignee}>
              {assignee ? (
                <Tooltip title={assignee.fullName || assignee.email}>
                  <Avatar
                    size={22}
                    style={{
                      backgroundColor: getAvatarColor(assignee.userId),
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(assignee.fullName, assignee.email)}
                  </Avatar>
                </Tooltip>
              ) : (
                <Tooltip title="Unassigned">
                  <Avatar
                    size={22}
                    style={{
                      backgroundColor: '#dfe1e6',
                      color: '#8993a4',
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    ?
                  </Avatar>
                </Tooltip>
              )}
            </span>

            {canModify && (
              <span className={styles.cellSprint}>
                <Select
                  size="small"
                  style={{ width: 160, borderRadius: 6, fontSize: 12 }}
                  placeholder="Add to sprint…"
                  value={undefined}
                  loading={isAssigning}
                  onChange={(value: string) => handleSprintAssign(issue.id, value || null)}
                  allowClear={false}
                  popupMatchSelectWidth={false}
                >
                  {eligibleSprints.map((s) => (
                    <Option key={s.id} value={s.id}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: s.status === 'ACTIVE' ? '#00875a' : '#ff8b00',
                            flexShrink: 0,
                            display: 'inline-block',
                          }}
                        />
                        {s.name}
                      </span>
                    </Option>
                  ))}
                </Select>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BacklogSection;
