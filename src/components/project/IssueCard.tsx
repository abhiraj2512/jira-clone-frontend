import React from 'react';
import { Avatar, Tooltip } from 'antd';
import {
  ArrowUpOutlined,
  MinusOutlined,
  ArrowDownOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import type { IssueSummary, IssuePriority } from '../../types/issue';
import type { ProjectMember } from '../../types/project';
import styles from './IssueCard.module.css';

interface IssueCardProps {
  issue: IssueSummary;
  members: ProjectMember[];
  projectKey: string;
  onClick: (issue: IssueSummary) => void;
}

const PRIORITY_ICON: Record<IssuePriority, React.ReactNode> = {
  HIGH:   <ArrowUpOutlined />,
  MEDIUM: <MinusOutlined />,
  LOW:    <ArrowDownOutlined />,
};

const PRIORITY_COLOR: Record<IssuePriority, string> = {
  HIGH:   '#de350b',
  MEDIUM: '#ff991f',
  LOW:    '#36b37e',
};

const PRIORITY_BG: Record<IssuePriority, string> = {
  HIGH:   '#ffebe6',
  MEDIUM: '#fff4e5',
  LOW:    '#e3fcef',
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

const IssueCard: React.FC<IssueCardProps> = ({ issue, members, projectKey, onClick }) => {
  const assignee = issue.assigneeId
    ? members.find((m) => m.userId === issue.assigneeId)
    : null;

  const priorityColor  = PRIORITY_COLOR[issue.priority];
  const priorityBg     = PRIORITY_BG[issue.priority];
  const priorityIcon   = PRIORITY_ICON[issue.priority];
  const issueKey = `${projectKey}-${shortId(issue.id)}`;

  return (
    <div className={styles.card} onClick={() => onClick(issue)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(issue)}>
      <p className={styles.title}>{issue.title}</p>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.issueKey}>
            <CheckSquareOutlined style={{ marginRight: 3 }} />
            {issueKey}
          </span>

          <span
            className={styles.priorityBadge}
            style={{ color: priorityColor, backgroundColor: priorityBg }}
          >
            {priorityIcon}
            <span className={styles.priorityLabel}>{issue.priority}</span>
          </span>
        </div>

        {assignee && (
          <Tooltip title={`${assignee.fullName || assignee.email}`}>
            <Avatar
              size={22}
              style={{
                backgroundColor: getAvatarColor(assignee.userId),
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {getInitials(assignee.fullName, assignee.email)}
            </Avatar>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default IssueCard;
