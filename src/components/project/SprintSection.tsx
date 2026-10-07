import React, { useState, useCallback, useEffect } from 'react';
import {
  Button,
  Divider,
  Skeleton,
  Alert,
  Tooltip,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  InboxOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { Sprint, CompleteSprintResponse } from '../../types/sprint';
import type { IssueSummary } from '../../types/issue';
import type { ProjectMember, ProjectRole } from '../../types/project';
import SprintCard from './SprintCard';
import CreateSprintModal from './CreateSprintModal';
import BacklogSection from './BacklogSection';
import styles from './SprintSection.module.css';

interface SprintSectionProps {
  projectId: string;
  projectKey: string;
  allIssues: IssueSummary[];
  members: ProjectMember[];
  myRole: ProjectRole | null;
  onIssueClick: (issue: IssueSummary) => void;
  onIssueSprintChanged: (issueId: string, sprintId: string | null) => void;
  onSprintBoardSelect?: (sprintId: string | null) => void;
}

const SprintSection: React.FC<SprintSectionProps> = ({
  projectId,
  projectKey,
  allIssues,
  members,
  myRole,
  onIssueClick,
  onIssueSprintChanged,
  onSprintBoardSelect,
}) => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [sprintsError, setSprintsError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const isAdmin = myRole === 'PROJECT_ADMIN';

  // Derive backlog issues: issues with no sprint
  const backlogIssues = allIssues.filter(
    (i) => !i.sprintId,
  );

  const fetchSprints = useCallback(async () => {
    if (!projectId) return;
    try {
      setSprintsLoading(true);
      setSprintsError(null);
      const res = await axiosInstance.get<Sprint[]>(`/projects/${projectId}/sprints`);
      setSprints(res.data);
    } catch (err: any) {
      setSprintsError(err.response?.data?.message || 'Failed to load sprints');
    } finally {
      setSprintsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);

  const handleSprintCreated = (sprint: Sprint) => {
    setCreateModalOpen(false);
    setSprints((prev) => {
      // Insert with counts defaulted to 0
      const enriched = { ...sprint, issueCount: 0, completedIssueCount: 0, completionPercentage: 0 };
      return [...prev, enriched];
    });
  };

  const handleSprintUpdated = (updated: Sprint) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
    );
  };

  const handleSprintDeleted = (sprintId: string) => {
    setSprints((prev) => prev.filter((s) => s.id !== sprintId));
  };

  const handleSprintCompleted = (result: CompleteSprintResponse) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === result.sprint.id ? { ...s, ...result.sprint } : s)),
    );
    // Notify parent to refresh issues (incomplete issues are now in backlog)
    onIssueSprintChanged('__refresh__', null);
  };

  const handleViewBoard = (sprint: Sprint) => {
    if (onSprintBoardSelect) onSprintBoardSelect(sprint.id);
  };

  const activeSprints = sprints.filter((s) => s.status === 'ACTIVE');
  const plannedSprints = sprints.filter((s) => s.status === 'PLANNED');
  const completedSprints = sprints.filter((s) => s.status === 'COMPLETED');

  return (
    <div className={styles.section}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.titleRow}>
          <ThunderboltOutlined className={styles.sectionIcon} />
          <h4 className={styles.sectionTitle}>Sprints &amp; Backlog</h4>
          {!sprintsLoading && (
            <div className={styles.sprintCounts}>
              {activeSprints.length > 0 && (
                <Tag color="green" style={{ fontSize: 11, fontWeight: 600 }}>
                  {activeSprints.length} Active
                </Tag>
              )}
              {plannedSprints.length > 0 && (
                <Tag color="orange" style={{ fontSize: 11 }}>
                  {plannedSprints.length} Planned
                </Tag>
              )}
              <Tag color="default" style={{ fontSize: 11 }}>
                {backlogIssues.length} Backlog
              </Tag>
            </div>
          )}
        </div>

        <div className={styles.headerActions}>
          <Tooltip title="Refresh sprints">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={fetchSprints}
              loading={sprintsLoading}
              style={{ color: '#5e6c84' }}
            />
          </Tooltip>
          {isAdmin && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              style={{
                background: '#0052cc',
                borderColor: '#0052cc',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Create Sprint
            </Button>
          )}
        </div>
      </div>

      {sprintsError && (
        <Alert
          type="error"
          message={sprintsError}
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          action={<Button size="small" onClick={fetchSprints}>Retry</Button>}
        />
      )}

      {sprintsLoading && sprints.length === 0 ? (
        <div>
          {[1, 2].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Active Sprints */}
          {activeSprints.length > 0 && (
            <div className={styles.sprintGroup}>
              <div className={styles.groupLabel}>
                <RocketOutlined style={{ color: '#00875a', marginRight: 6 }} />
                <span style={{ color: '#00875a', fontWeight: 700, fontSize: 13 }}>
                  ACTIVE SPRINT
                </span>
              </div>
              {activeSprints.map((sprint) => (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  myRole={myRole}
                  onSprintUpdated={handleSprintUpdated}
                  onSprintDeleted={handleSprintDeleted}
                  onSprintCompleted={handleSprintCompleted}
                  onViewBoard={handleViewBoard}
                />
              ))}
            </div>
          )}

          {/* Planned Sprints */}
          {plannedSprints.length > 0 && (
            <div className={styles.sprintGroup}>
              <div className={styles.groupLabel}>
                <span style={{ color: '#ff8b00', fontWeight: 700, fontSize: 13 }}>
                  PLANNED SPRINTS
                </span>
              </div>
              {plannedSprints.map((sprint) => (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  myRole={myRole}
                  onSprintUpdated={handleSprintUpdated}
                  onSprintDeleted={handleSprintDeleted}
                  onSprintCompleted={handleSprintCompleted}
                  onViewBoard={handleViewBoard}
                />
              ))}
            </div>
          )}

          {/* Completed Sprints */}
          {completedSprints.length > 0 && (
            <div className={styles.sprintGroup}>
              <div className={styles.groupLabel}>
                <span style={{ color: '#5e6c84', fontWeight: 700, fontSize: 13 }}>
                  COMPLETED SPRINTS
                </span>
              </div>
              {completedSprints.map((sprint) => (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  myRole={myRole}
                  onSprintUpdated={handleSprintUpdated}
                  onSprintDeleted={handleSprintDeleted}
                  onSprintCompleted={handleSprintCompleted}
                />
              ))}
            </div>
          )}

          {sprints.length === 0 && !sprintsLoading && (
            <div className={styles.noSprints}>
              <ThunderboltOutlined style={{ fontSize: 28, color: '#c1c7d0' }} />
              <p style={{ color: '#8993a4', margin: '8px 0 4px', fontWeight: 600 }}>
                No sprints yet
              </p>
              <p style={{ color: '#a5adba', fontSize: 13, margin: 0 }}>
                {isAdmin
                  ? 'Create a sprint to start planning your work.'
                  : 'A Project Admin will create sprints for this project.'}
              </p>
              {isAdmin && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => setCreateModalOpen(true)}
                  style={{
                    marginTop: 12,
                    background: '#0052cc',
                    borderColor: '#0052cc',
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  Create Sprint
                </Button>
              )}
            </div>
          )}

          {/* Divider */}
          {sprints.length > 0 && <Divider style={{ margin: '20px 0 16px' }} />}

          {/* Backlog */}
          <div className={styles.backlogSection}>
            <div className={styles.backlogHeader}>
              <div className={styles.groupLabel} style={{ marginBottom: 0 }}>
                <InboxOutlined style={{ color: '#5e6c84', marginRight: 6 }} />
                <span style={{ color: '#5e6c84', fontWeight: 700, fontSize: 13 }}>
                  BACKLOG
                </span>
                <span
                  style={{
                    marginLeft: 8,
                    background: '#ebecf0',
                    color: '#42526e',
                    borderRadius: 10,
                    padding: '1px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {backlogIssues.length}
                </span>
              </div>
            </div>
            <BacklogSection
              issues={backlogIssues}
              sprints={sprints}
              members={members}
              myRole={myRole}
              loading={false}
              projectKey={projectKey}
              onIssueClick={onIssueClick}
              onIssueSprintChanged={onIssueSprintChanged}
            />
          </div>
        </>
      )}

      {/* Modals */}
      {createModalOpen && (
        <CreateSprintModal
          open={createModalOpen}
          projectId={projectId}
          onCancel={() => setCreateModalOpen(false)}
          onSuccess={handleSprintCreated}
        />
      )}
    </div>
  );
};

export default SprintSection;
