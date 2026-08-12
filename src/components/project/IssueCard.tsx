import React from 'react';
import { Avatar, Tooltip, Tag } from 'antd';
import {
  ArrowUpOutlined,
  MinusOutlined,
  ArrowDownOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { IssueSummary, IssuePriority, IssueStatus } from '../../types/issue';
import type { ProjectMember } from '../../types/project';
import styles from './IssueCard.module.css';

interface IssueCardProps {
  issue: IssueSummary;
  members: ProjectMember[];
  projectKey: string;
  onClick: (issue: IssueSummary) => void;
  isDragging?: boolean;
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

const PRIORITY_LABEL: Record<IssuePriority, string> = {
  HIGH:   'High',
  MEDIUM: 'Medium',
  LOW:    'Low',
};

const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string; bg: string }> = {
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

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const IssueCard: React.FC<IssueCardProps> = React.memo(
  ({ issue, members, projectKey, onClick, isDragging }) => {
    const assignee = issue.assigneeId
      ? members.find((m) => m.userId === issue.assigneeId)
      : null;

    const priorityColor = PRIORITY_COLOR[issue.priority];
    const priorityBg    = PRIORITY_BG[issue.priority];
    const priorityIcon  = PRIORITY_ICON[issue.priority];
    const statusCfg     = STATUS_CONFIG[issue.status];
    const issueKey      = `${projectKey}-${shortId(issue.id)}`;
    const updatedLabel  = formatDate(issue.updatedAt ?? issue.createdAt);

    return (
      <div
        className={`${styles.card} ${isDragging ? styles.cardDragging : ''}`}
        onClick={() => onClick(issue)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick(issue)}
        aria-label={`Issue: ${issue.title}, priority: ${issue.priority}, status: ${issue.status}`}
      >
        <p className={styles.title}>{issue.title}</p>

        <div className={styles.metaRow}>
          <Tag
            className={styles.statusTag}
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

          <span
            className={styles.priorityBadge}
            style={{ color: priorityColor, backgroundColor: priorityBg }}
            aria-label={`Priority: ${PRIORITY_LABEL[issue.priority]}`}
          >
            {priorityIcon}
            <span className={styles.priorityLabel}>{PRIORITY_LABEL[issue.priority]}</span>
          </span>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <span className={styles.issueKey}>
              <CheckSquareOutlined style={{ marginRight: 3 }} />
              {issueKey}
            </span>

            {updatedLabel && (
              <Tooltip title={`Last updated: ${issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : 'N/A'}`}>
                <span className={styles.updatedDate}>
                  <ClockCircleOutlined style={{ marginRight: 2 }} />
                  {updatedLabel}
                </span>
              </Tooltip>
            )}
          </div>

          {assignee ? (
            <Tooltip title={assignee.fullName || assignee.email}>
              <Avatar
                size={24}
                style={{
                  backgroundColor: getAvatarColor(assignee.userId),
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                  cursor: 'default',
                }}
              >
                {getInitials(assignee.fullName, assignee.email)}
              </Avatar>
            </Tooltip>
          ) : (
            <Tooltip title="Unassigned">
              <Avatar
                size={24}
                style={{
                  backgroundColor: '#dfe1e6',
                  color: '#8993a4',
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ?
              </Avatar>
            </Tooltip>
          )}
        </div>
      </div>
    );
  },
);

IssueCard.displayName = 'IssueCard';

export default IssueCard;
