import React from 'react';
import { Input, Select, Avatar, Tooltip } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { IssueStatus, IssuePriority } from '../../types/issue';
import type { ProjectMember } from '../../types/project';
import styles from './BoardFilters.module.css';

const { Option } = Select;

export interface FilterState {
  search: string;
  status: IssueStatus | 'ALL';
  priority: IssuePriority | 'ALL';
  assigneeId: string | 'ALL' | 'UNASSIGNED';
}

interface BoardFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  members: ProjectMember[];
  totalIssues: number;
  filteredCount: number;
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

const BoardFilters: React.FC<BoardFiltersProps> = ({
  filters,
  onChange,
  members,
  totalIssues,
  filteredCount,
}) => {
  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.assigneeId !== 'ALL';

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <Input
          id="board-search"
          className={styles.searchInput}
          placeholder="Search issues…"
          prefix={<SearchOutlined className={styles.searchIcon} />}
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          allowClear
        />

        <Select
          id="board-status-filter"
          className={styles.filterSelect}
          value={filters.status}
          onChange={(v) => update({ status: v })}
          placeholder="Status"
        >
          <Option value="ALL">All Statuses</Option>
          <Option value="TODO">To Do</Option>
          <Option value="IN_PROGRESS">In Progress</Option>
          <Option value="DONE">Done</Option>
        </Select>

        <Select
          id="board-priority-filter"
          className={styles.filterSelect}
          value={filters.priority}
          onChange={(v) => update({ priority: v })}
          placeholder="Priority"
        >
          <Option value="ALL">All Priorities</Option>
          <Option value="HIGH">
            <span className={styles.priorityDot} style={{ background: '#de350b' }} />
            High
          </Option>
          <Option value="MEDIUM">
            <span className={styles.priorityDot} style={{ background: '#ff991f' }} />
            Medium
          </Option>
          <Option value="LOW">
            <span className={styles.priorityDot} style={{ background: '#36b37e' }} />
            Low
          </Option>
        </Select>

        <Select
          id="board-assignee-filter"
          className={styles.filterSelect}
          value={filters.assigneeId}
          onChange={(v) => update({ assigneeId: v })}
          placeholder="Assignee"
        >
          <Option value="ALL">All Assignees</Option>
          <Option value="UNASSIGNED">Unassigned</Option>
          {members.map((m) => (
            <Option key={m.userId} value={m.userId}>
              <div className={styles.assigneeOption}>
                <Avatar
                  size={18}
                  style={{ backgroundColor: getAvatarColor(m.userId), fontSize: 9, fontWeight: 700 }}
                >
                  {getInitials(m.fullName, m.email)}
                </Avatar>
                <span>{m.fullName || m.email}</span>
              </div>
            </Option>
          ))}
        </Select>

        {hasActiveFilters && (
          <Tooltip title="Clear all filters">
            <button
              className={styles.clearBtn}
              onClick={() =>
                onChange({ search: '', status: 'ALL', priority: 'ALL', assigneeId: 'ALL' })
              }
            >
              Clear
            </button>
          </Tooltip>
        )}
      </div>

      {hasActiveFilters && (
        <div className={styles.resultCount}>
          Showing {filteredCount} of {totalIssues} issues
        </div>
      )}
    </div>
  );
};

export default BoardFilters;
