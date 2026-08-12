import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Skeleton, Alert, Button, message } from 'antd';
import { PlusOutlined, InboxOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axios';
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
  emptyLabel: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    status: 'TODO',
    label: 'To Do',
    accentColor: '#5e6c84',
    countBg: '#ebecf0',
    countColor: '#42526e',
    emptyLabel: 'No tasks yet',
  },
  {
    status: 'IN_PROGRESS',
    label: 'In Progress',
    accentColor: '#0052cc',
    countBg: '#deebff',
    countColor: '#0052cc',
    emptyLabel: 'Nothing in progress',
  },
  {
    status: 'DONE',
    label: 'Done',
    accentColor: '#00875a',
    countBg: '#e3fcef',
    countColor: '#00875a',
    emptyLabel: 'No completed issues',
  },
];

interface DraggableCardProps {
  issue: IssueSummary;
  members: ProjectMember[];
  projectKey: string;
  onIssueClick: (issue: IssueSummary) => void;
}

const DraggableCard: React.FC<DraggableCardProps> = React.memo(
  ({ issue, members, projectKey, onIssueClick }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({ id: issue.id, data: { issue } });

    const style: React.CSSProperties = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.3 : 1,
      cursor: isDragging ? 'grabbing' : 'grab',
      touchAction: 'none',
    };

    return (
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <IssueCard
          issue={issue}
          members={members}
          projectKey={projectKey}
          onClick={onIssueClick}
          isDragging={isDragging}
        />
      </div>
    );
  },
);
DraggableCard.displayName = 'DraggableCard';

interface DroppableColumnProps {
  col: KanbanColumn;
  issues: IssueSummary[];
  allIssuesEmpty: boolean;
  members: ProjectMember[];
  projectKey: string;
  onIssueClick: (issue: IssueSummary) => void;
  onCreateIssue?: () => void;
  isOver: boolean;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  col,
  issues,
  allIssuesEmpty,
  members,
  projectKey,
  onIssueClick,
  onCreateIssue,
  isOver,
}) => {
  const { setNodeRef } = useDroppable({ id: col.status });

  return (
    <div
      className={`${styles.column} ${isOver ? styles.columnDragOver : ''}`}
      aria-label={`${col.label} column with ${issues.length} issues`}
    >
      <div className={styles.columnHeader}>
        <div className={styles.columnTitleRow}>
          <span className={styles.columnDot} style={{ background: col.accentColor }} />
          <span className={styles.columnTitle}>{col.label}</span>
        </div>
        <span
          className={styles.columnCount}
          style={{ background: col.countBg, color: col.countColor }}
          aria-label={`${issues.length} issues`}
        >
          {issues.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`${styles.issuesList} ${isOver ? styles.issuesListOver : ''}`}
      >
        {issues.length === 0 ? (
          <div className={`${styles.emptyColumn} ${isOver ? styles.emptyColumnOver : ''}`}>
            {allIssuesEmpty ? (
              <div className={styles.emptyStateContent}>
                <InboxOutlined className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>No issues yet</p>
                <p className={styles.emptySubtitle}>
                  {col.status === 'TODO' ? 'Create your first issue to get started' : col.emptyLabel}
                </p>
                {col.status === 'TODO' && onCreateIssue && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={onCreateIssue}
                    className={styles.createFirstIssueBtn}
                  >
                    Create Issue
                  </Button>
                )}
              </div>
            ) : (
              <div className={styles.emptyColumnSimple}>
                <span className={styles.emptyColumnText}>
                  {isOver ? '⬇ Drop here' : col.emptyLabel}
                </span>
              </div>
            )}
          </div>
        ) : (
          issues.map((issue) => (
            <DraggableCard
              key={issue.id}
              issue={issue}
              members={members}
              projectKey={projectKey}
              onIssueClick={onIssueClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

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

interface KanbanBoardProps {
  issues: IssueSummary[];
  members: ProjectMember[];
  projectKey: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onIssueClick: (issue: IssueSummary) => void;
  onStatusChange: (issueId: string, newStatus: IssueStatus) => void;
  onCreateIssue?: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  issues,
  members,
  projectKey,
  loading,
  error,
  onRetry,
  onIssueClick,
  onStatusChange,
  onCreateIssue,
}) => {
  const [activeIssue, setActiveIssue] = useState<IssueSummary | null>(null);
  const [overId, setOverId] = useState<IssueStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const issuesByStatus = useMemo(() => {
    const map: Record<IssueStatus, IssueSummary[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const issue of issues) {
      if (map[issue.status]) map[issue.status].push(issue);
    }
    return map;
  }, [issues]);

  const allIssuesEmpty = issues.length === 0;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const issue = event.active.data.current?.issue as IssueSummary | undefined;
    setActiveIssue(issue ?? null);
  }, []);

  const handleDragOver = useCallback((event: { over: { id: unknown } | null }) => {
    const ovStatus = event.over?.id as IssueStatus | null;
    setOverId(ovStatus && ['TODO', 'IN_PROGRESS', 'DONE'].includes(ovStatus as string) ? ovStatus : null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveIssue(null);
      setOverId(null);

      const { active, over } = event;
      if (!over) return;

      const issueId = active.id as string;
      const newStatus = over.id as IssueStatus;
      const currentIssue = issues.find((i) => i.id === issueId);

      if (!currentIssue || currentIssue.status === newStatus) return;
      if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(newStatus)) return;

      onStatusChange(issueId, newStatus);

      try {
        await axiosInstance.patch(`/issues/${issueId}/status`, { status: newStatus });
        message.success(`Moved to ${COLUMNS.find((c) => c.status === newStatus)?.label ?? newStatus}`);
      } catch (err: any) {
        onStatusChange(issueId, currentIssue.status);
        message.error(
          err.response?.data?.message || 'Failed to update status — change reverted',
        );
      }
    },
    [issues, onStatusChange],
  );

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load issues"
        description={error}
        showIcon
        style={{ borderRadius: 8 }}
        action={<Button size="small" onClick={onRetry}>Retry</Button>}
      />
    );
  }

  if (loading) {
    return (
      <div className={styles.board}>
        {COLUMNS.map((col) => <ColumnSkeleton key={col.status} />)}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.board} role="region" aria-label="Kanban board">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.status}
            col={col}
            issues={issuesByStatus[col.status]}
            allIssuesEmpty={allIssuesEmpty}
            members={members}
            projectKey={projectKey}
            onIssueClick={onIssueClick}
            onCreateIssue={onCreateIssue}
            isOver={overId === col.status}
          />
        ))}
      </div>

      <DragOverlay>
        {activeIssue ? (
          <div className={styles.dragOverlay}>
            <IssueCard
              issue={activeIssue}
              members={members}
              projectKey={projectKey}
              onClick={() => {}}
              isDragging={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
