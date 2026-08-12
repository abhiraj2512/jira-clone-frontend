import React, { useState, useEffect } from 'react';
import { Timeline, Avatar, Skeleton, notification, Tooltip } from 'antd';
import {
  PlusCircleOutlined,
  EditOutlined,
  SwapOutlined,
  FlagOutlined,
  UserSwitchOutlined,
  MessageOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { ActivityLog, ActivityActionType } from '../../types/activity';
import styles from './IssueActivityTimeline.module.css';

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

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_LABEL: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

function buildDescription(activity: ActivityLog): { text: string; icon: React.ReactNode; color: string } {
  const name   = activity.actor.fullName || activity.actor.email;
  const old    = activity.oldValue;
  const newer  = activity.newValue;

  switch (activity.actionType as ActivityActionType) {
    case 'ISSUE_CREATED':
      return { text: `${name} created this issue`, icon: <PlusCircleOutlined />, color: '#00875a' };

    case 'ISSUE_UPDATED':
      return { text: `${name} updated the issue`, icon: <EditOutlined />, color: '#0052cc' };

    case 'STATUS_CHANGED': {
      const from = STATUS_LABEL[old?.oldStatus] ?? old?.oldStatus ?? '?';
      const to   = STATUS_LABEL[newer?.newStatus] ?? newer?.newStatus ?? '?';
      return {
        text: `${name} changed status from ${from} → ${to}`,
        icon: <SwapOutlined />,
        color: '#0052cc',
      };
    }

    case 'PRIORITY_CHANGED': {
      const from = PRIORITY_LABEL[old?.oldPriority] ?? old?.oldPriority ?? '?';
      const to   = PRIORITY_LABEL[newer?.newPriority] ?? newer?.newPriority ?? '?';
      return {
        text: `${name} changed priority from ${from} → ${to}`,
        icon: <FlagOutlined />,
        color: '#ff8b00',
      };
    }

    case 'ASSIGNEE_CHANGED':
      return {
        text: `${name} changed the assignee`,
        icon: <UserSwitchOutlined />,
        color: '#6554c0',
      };

    case 'COMMENT_ADDED':
      return { text: `${name} added a comment`, icon: <MessageOutlined />, color: '#00b8d9' };

    case 'COMMENT_UPDATED':
      return { text: `${name} edited a comment`, icon: <MessageOutlined />, color: '#5e6c84' };

    case 'COMMENT_DELETED':
      return { text: `${name} deleted a comment`, icon: <DeleteOutlined />, color: '#de350b' };

    case 'ISSUE_DELETED':
      return { text: `${name} deleted an issue`, icon: <DeleteOutlined />, color: '#de350b' };

    case 'ASSIGNED':
      return { text: `${name} changed the assignee`, icon: <UserSwitchOutlined />, color: '#6554c0' };

    default:
      return { text: `${name} performed an action`, icon: <InfoCircleOutlined />, color: '#8993a4' };
  }
}

interface IssueActivityTimelineProps {
  issueId: string;
  refreshTrigger: number;
}

const IssueActivityTimeline: React.FC<IssueActivityTimelineProps> = ({ issueId, refreshTrigger }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading]       = useState(true);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<ActivityLog[]>(`/issues/${issueId}/activity`);
      setActivities(res.data);
    } catch (err: any) {
      notification.error({
        message: 'Failed to load activity',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) fetchActivity();
  }, [issueId, refreshTrigger]);

  if (loading) {
    return (
      <div className={styles.skeleton}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonRow}>
            <Skeleton.Avatar active size={24} />
            <Skeleton active paragraph={{ rows: 1 }} title={false} />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📋</span>
        <p>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Timeline
        mode="left"
        items={activities.map((activity) => {
          const { text, color } = buildDescription(activity);

          return {
            color,
            dot: (
              <Avatar
                size={24}
                style={{
                  backgroundColor: getAvatarColor(activity.actor.userId),
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {getInitials(activity.actor.fullName, activity.actor.email)}
              </Avatar>
            ),
            children: (
              <div className={styles.activityItem}>
                <span className={styles.activityText}>{text}</span>
                <Tooltip title={new Date(activity.createdAt).toLocaleString()}>
                  <span className={styles.activityTime}>{relativeTime(activity.createdAt)}</span>
                </Tooltip>
              </div>
            ),
          };
        })}
      />
    </div>
  );
};

export default IssueActivityTimeline;
