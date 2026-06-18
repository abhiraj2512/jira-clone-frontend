import React from 'react';
import { Skeleton, Alert, Button } from 'antd';
import IssueCard from './IssueCard';
import type { IssueSummary, IssueStatus } from '../../types/issue';
import type { ProjectMember } from '../../types/project';
import styles from './KanbanBoard.module.css';

interface KanbanColumn {
  status: IssueStatus;
  label: string;
  accentColor: string;
  countBg: string;
  countColor: string;
}

const COLUMNS: KanbanColumn[] = [
  { status: 'TODO',        label: 'To Do',       accentColor: '#5e6c84', countBg: '#ebecf0', countColor: '#42526e' },
  { status: 'IN_PROGRESS', label: 'In Progress', accentColor: '#0052cc', countBg: '#deebff', countColor: '#0052cc' },
  { status: 'DONE',        label: 'Done',        accentColor: '#00875a', countBg: '#e3fcef', countColor: '#00875a' },
];

interface KanbanBoardProps {
  issues: IssueSummary[];
  members: ProjectMember[];
  projectKey: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onIssueClick: (issue: IssueSummary) => void;
}

const ColumnSkeleton: React.FC = () => (
  <div className={styles.column}>
    <div className={styles.columnHeader}>
      <Skeleton.Input active size="small" style={{ width: 90, height: 16 }} />
      <Skeleton.Avatar active size={20} shape="circle" />
    </div>
    {[1, 2, 3].map((i) => (
      <div key={i} className={styles.skeletonCard}>
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
      </div>
    ))}
  </div>
);

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  issues,
  members,
  projectKey,
  loading,
  error,
  onRetry,
  onIssueClick,
}) => {
  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load issues"
        description={error}
        showIcon
        style={{ borderRadius: 8 }}
        action={
          <Button size="small" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }

  if (loading) {
    return (
      <div className={styles.board}>
        {COLUMNS.map((col) => (
          <ColumnSkeleton key={col.status} />
        ))}
      </div>
    );
  }

  const totalIssues = issues.length;

  return (
    <div className={styles.board}>
      {COLUMNS.map((col) => {
        const colIssues = issues.filter((i) => i.status === col.status);
        return (
          <div key={col.status} className={styles.column}>
            {/* Column header */}
            <div className={styles.columnHeader}>
              <div className={styles.columnTitleRow}>
                <span
                  className={styles.columnDot}
                  style={{ background: col.accentColor }}
                />
                <span className={styles.columnTitle}>{col.label}</span>
              </div>
              <span
                className={styles.columnCount}
                style={{ background: col.countBg, color: col.countColor }}
              >
                {colIssues.length}
              </span>
            </div>

            {/* Issues list */}
            <div className={styles.issuesList}>
              {colIssues.length === 0 ? (
                <div className={styles.emptyColumn}>
                  {totalIssues === 0 ? 'No issues yet' : 'No issues here'}
                </div>
              ) : (
                colIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    members={members}
                    projectKey={projectKey}
                    onClick={onIssueClick}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
