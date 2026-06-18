import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Button,
  Popconfirm,
  Breadcrumb,
  Row,
  Col,
  Tooltip,
  message,
  Tag,
  Skeleton,
  Alert,
  Divider,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  CrownOutlined,
  CodeOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserAddOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { Project, ProjectMember, ProjectRole } from '../../types/project';
import type { IssueSummary, Issue, IssueStatus } from '../../types/issue';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../../components/common/PageLoader';
import ErrorState from '../../components/common/ErrorState';
import EditProjectModal from '../../components/project/EditProjectModal';
import InviteMemberModal from '../../components/project/InviteMemberModal';
import TeamMembersSection from '../../components/project/TeamMembersSection';
import KanbanBoard from '../../components/project/KanbanBoard';
import CreateIssueModal from '../../components/project/CreateIssueModal';
import IssueDrawer from '../../components/project/IssueDrawer';
import BoardFilters from '../../components/project/BoardFilters';
import type { FilterState } from '../../components/project/BoardFilters';
import styles from './ProjectPage.module.css';

const { Title, Text } = Typography;

// ── RBAC helpers ──────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<
  ProjectRole,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  PROJECT_ADMIN: { label: 'Project Admin', color: '#974f0c', bg: '#fff7e6', icon: <CrownOutlined /> },
  DEVELOPER:     { label: 'Developer',     color: '#006644', bg: '#e3fcef', icon: <CodeOutlined /> },
  VIEWER:        { label: 'Viewer',        color: '#344563', bg: '#ebecf0', icon: <EyeOutlined /> },
};

const canEditProject  = (r: ProjectRole | null) => r === 'PROJECT_ADMIN';
const canDeleteProject = (r: ProjectRole | null) => r === 'PROJECT_ADMIN';
const canInviteMembers = (r: ProjectRole | null) => r === 'PROJECT_ADMIN';
const canCreateIssue   = (r: ProjectRole | null) => r === 'PROJECT_ADMIN' || r === 'DEVELOPER';

// ── Filter logic ──────────────────────────────────────────────────────────────
function applyFilters(issues: IssueSummary[], f: FilterState): IssueSummary[] {
  return issues.filter((issue) => {
    if (f.search && !issue.title.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.status !== 'ALL' && issue.status !== f.status) return false;
    if (f.priority !== 'ALL' && issue.priority !== f.priority) return false;
    if (f.assigneeId === 'UNASSIGNED' && issue.assigneeId !== null) return false;
    if (f.assigneeId !== 'ALL' && f.assigneeId !== 'UNASSIGNED' && issue.assigneeId !== f.assigneeId) return false;
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'ALL',
  priority: 'ALL',
  assigneeId: 'ALL',
};

const ProjectPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Project ──────────────────────────────────────────────────────────────
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Members ──────────────────────────────────────────────────────────────
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<ProjectRole | null>(null);

  // ── Issues ───────────────────────────────────────────────────────────────
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const filteredIssues = useMemo(() => applyFilters(issues, filters), [issues, filters]);

  // ── Modal / Drawer states ─────────────────────────────────────────────────
  const [editModalOpen,   setEditModalOpen]   = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // ── Fetch project ─────────────────────────────────────────────────────────
  const fetchProject = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get<Project>(`/projects/${projectId}`);
      setProject(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load project details');
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // ── Fetch members ─────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    try {
      setMembersLoading(true);
      setMembersError(null);
      const res = await axiosInstance.get<ProjectMember[]>(`/projects/${projectId}/members`);
      setMembers(res.data);
      if (user?.id) {
        const mine = res.data.find((m) => m.userId === user.id);
        setMyRole(mine?.role ?? null);
      }
    } catch (err: any) {
      setMembersError(err.response?.data?.message || 'Failed to load team members');
    } finally {
      setMembersLoading(false);
    }
  }, [projectId, user?.id]);

  // ── Fetch issues ──────────────────────────────────────────────────────────
  const fetchIssues = useCallback(async () => {
    if (!projectId) return;
    try {
      setIssuesLoading(true);
      setIssuesError(null);
      const res = await axiosInstance.get<IssueSummary[]>(`/projects/${projectId}/issues`);
      setIssues(res.data);
    } catch (err: any) {
      setIssuesError(err.response?.data?.message || 'Failed to load issues');
    } finally {
      setIssuesLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
    fetchMembers();
    fetchIssues();
  }, [fetchProject, fetchMembers, fetchIssues]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDeleteProject = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/projects/${projectId}`);
      message.success('Project deleted successfully');
      navigate('/dashboard');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to delete project');
      setLoading(false);
    }
  };

  const handleEditSuccess = (updated: Project) => setProject(updated);

  const handleInviteSuccess = () => {
    setInviteModalOpen(false);
    fetchMembers();
  };

  const handleIssueCreated = (newIssue: IssueSummary) => {
    setCreateIssueOpen(false);
    setIssues((prev) => [newIssue, ...prev]);
  };

  const handleIssueUpdated = (updated: Issue) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === updated.id
          ? {
              ...i,
              title: updated.title,
              status: updated.status,
              priority: updated.priority,
              assigneeId: updated.assigneeId,
            }
          : i,
      ),
    );
  };

  const handleIssueStatusChanged = (issueId: string, newStatus: IssueStatus) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)),
    );
  };

  const handleIssueDeleted = (issueId: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading && !project) return <PageLoader />;
  if (error) {
    return (
      <div className={styles.container}>
        <ErrorState message={error} onRetry={fetchProject} />
      </div>
    );
  }
  if (!project) {
    return (
      <div className={styles.container}>
        <ErrorState message="Project not found." onRetry={fetchProject} />
      </div>
    );
  }

  const projectCreatedDate = new Date(project.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const roleConfig = myRole ? ROLE_CONFIG[myRole] : null;

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumbContainer}>
        <Breadcrumb
          items={[
            { title: <Link to="/dashboard">Dashboard</Link> },
            { title: project.name },
          ]}
        />
      </div>

      {/* Page Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleSection}>
          <Title level={2} className={styles.projectTitle}>{project.name}</Title>
          <span className={styles.projectKeyTag}>{project.key}</span>
          {roleConfig && (
            <Tag
              icon={roleConfig.icon}
              className={styles.myRoleBadge}
              style={{ color: roleConfig.color, backgroundColor: roleConfig.bg, border: 'none' }}
            >
              {roleConfig.label}
            </Tag>
          )}
        </div>

        <div className={styles.actionsContainer}>
          {canCreateIssue(myRole) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateIssueOpen(true)}
              className={styles.createIssueBtn}
            >
              Create Issue
            </Button>
          )}
          {canInviteMembers(myRole) && (
            <Button
              icon={<UserAddOutlined />}
              onClick={() => setInviteModalOpen(true)}
              className={styles.inviteBtn}
            >
              Invite Member
            </Button>
          )}
          {canEditProject(myRole) && (
            <Button
              icon={<EditOutlined />}
              onClick={() => setEditModalOpen(true)}
              className={styles.editBtn}
            >
              Edit
            </Button>
          )}
          {canDeleteProject(myRole) && (
            <Popconfirm
              title="Delete Project"
              description={`Delete "${project.name}"? This cannot be undone.`}
              onConfirm={handleDeleteProject}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading }}
            >
              <Button type="primary" danger icon={<DeleteOutlined />} className={styles.deleteBtn}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      {/* Main layout */}
      <Row gutter={[24, 24]}>
        {/* Left: Description + Issues Board */}
        <Col xs={24} lg={17}>
          {/* Description */}
          <div className={styles.mainCard}>
            <h4 className={styles.sectionTitle}>
              <InfoCircleOutlined className={styles.sectionIcon} />
              Description
            </h4>
            <div className={styles.descriptionBox}>
              <Text>{project.description || 'No description provided for this project.'}</Text>
            </div>
          </div>

          {/* Issues Board */}
          <div className={styles.boardSection}>
            <div className={styles.boardHeader}>
              <h4 className={styles.sectionTitle} style={{ margin: 0 }}>
                <UnorderedListOutlined className={styles.sectionIcon} />
                Issues Board
                {!issuesLoading && (
                  <span className={styles.issueCountChip}>{issues.length}</span>
                )}
              </h4>
              <div className={styles.boardHeaderActions}>
                <Tooltip title="Refresh issues">
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={fetchIssues}
                    loading={issuesLoading}
                    style={{ color: '#5e6c84' }}
                  />
                </Tooltip>
              </div>
            </div>

            {/* Filters */}
            {!issuesError && (
              <div className={styles.filtersRow}>
                <BoardFilters
                  filters={filters}
                  onChange={setFilters}
                  members={members}
                  totalIssues={issues.length}
                  filteredCount={filteredIssues.length}
                />
              </div>
            )}

            {/* Board */}
            <KanbanBoard
              issues={filteredIssues}
              members={members}
              projectKey={project.key}
              loading={issuesLoading}
              error={issuesError}
              onRetry={fetchIssues}
              onIssueClick={(issue) => setSelectedIssueId(issue.id)}
            />
          </div>
        </Col>

        {/* Right: Sidebar */}
        <Col xs={24} lg={7}>
          <div className={styles.rightSidebar}>
            {/* Details card */}
            <div className={styles.sidebarCard}>
              <h4 className={styles.sidebarTitle}>
                <InfoCircleOutlined className={styles.sidebarIcon} />
                Details
              </h4>
              <div className={styles.metaGrid}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Project Key</span>
                  <span className={styles.metaValue}>
                    <Text keyboard>{project.key}</Text>
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Created At</span>
                  <span className={styles.metaValue}>{projectCreatedDate}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Members</span>
                  <span className={styles.metaValue}>
                    {membersLoading ? (
                      <Skeleton.Input active size="small" style={{ width: 40 }} />
                    ) : (
                      <span className={styles.memberCountBadge}>{members.length}</span>
                    )}
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Issues</span>
                  <span className={styles.metaValue}>
                    {issuesLoading ? (
                      <Skeleton.Input active size="small" style={{ width: 40 }} />
                    ) : (
                      <span className={styles.memberCountBadge}>{issues.length}</span>
                    )}
                  </span>
                </div>
                {myRole && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Your Role</span>
                    <span className={styles.metaValue}>
                      <Tag
                        icon={roleConfig?.icon}
                        style={{
                          color: roleConfig?.color,
                          backgroundColor: roleConfig?.bg,
                          border: 'none',
                          fontWeight: 600,
                          fontSize: 11,
                          margin: 0,
                        }}
                      >
                        {roleConfig?.label}
                      </Tag>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Team Members card */}
            <div className={styles.sidebarCard}>
              <div className={styles.teamHeader}>
                <h4 className={styles.sidebarTitle} style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
                  <TeamOutlined className={styles.sidebarIcon} />
                  Team Members
                  {!membersLoading && (
                    <span className={styles.memberCountChip}>{members.length}</span>
                  )}
                </h4>
                <div className={styles.teamActions}>
                  <Tooltip title="Refresh members">
                    <Button
                      type="text"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={fetchMembers}
                      loading={membersLoading}
                      style={{ color: '#5e6c84' }}
                    />
                  </Tooltip>
                  {canInviteMembers(myRole) && (
                    <Tooltip title="Invite member">
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => setInviteModalOpen(true)}
                        style={{
                          background: '#0052cc',
                          borderColor: '#0052cc',
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        Invite
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>

              <Divider style={{ margin: '12px 0 16px' }} />

              {membersError ? (
                <Alert
                  type="error"
                  message={membersError}
                  showIcon
                  style={{ borderRadius: 6 }}
                  action={<Button size="small" onClick={fetchMembers}>Retry</Button>}
                />
              ) : (
                <TeamMembersSection
                  members={members}
                  loading={membersLoading}
                  currentUserId={user?.id ?? ''}
                />
              )}

              {!canInviteMembers(myRole) && !membersLoading && members.length > 0 && (
                <p className={styles.rbacNote}>
                  {myRole === 'VIEWER'
                    ? 'You have read-only access to this project.'
                    : 'Contact a Project Admin to invite new members.'}
                </p>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* ── Modals & Drawers ────────────────────────────────────────────── */}
      <EditProjectModal
        open={editModalOpen}
        project={project}
        onCancel={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {projectId && (
        <InviteMemberModal
          open={inviteModalOpen}
          projectId={projectId}
          onCancel={() => setInviteModalOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

      {projectId && (
        <CreateIssueModal
          open={createIssueOpen}
          projectId={projectId}
          members={members}
          onCancel={() => setCreateIssueOpen(false)}
          onSuccess={handleIssueCreated}
        />
      )}

      <IssueDrawer
        issueId={selectedIssueId}
        members={members}
        myRole={myRole}
        onClose={() => setSelectedIssueId(null)}
        onIssueUpdated={handleIssueUpdated}
        onIssueStatusChanged={handleIssueStatusChanged}
        onIssueDeleted={handleIssueDeleted}
      />
    </div>
  );
};

export default ProjectPage;
