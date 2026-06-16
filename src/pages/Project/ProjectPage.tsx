import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Button,
  Popconfirm,
  Breadcrumb,
  Row,
  Col,
  Tooltip,
  Badge,
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
  UnorderedListOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  MinusOutlined,
  CrownOutlined,
  CodeOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { Project, ProjectMember, ProjectRole } from '../../types/project';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../../components/common/PageLoader';
import ErrorState from '../../components/common/ErrorState';
import EditProjectModal from '../../components/project/EditProjectModal';
import InviteMemberModal from '../../components/project/InviteMemberModal';
import TeamMembersSection from '../../components/project/TeamMembersSection';
import styles from './ProjectPage.module.css';

const { Title, Text } = Typography;

// ── RBAC helpers ──────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<
  ProjectRole,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  PROJECT_ADMIN: { label: 'Project Admin', color: '#974f0c', bg: '#fff7e6', icon: <CrownOutlined /> },
  DEVELOPER:     { label: 'Developer',     color: '#006644', bg: '#e3fcef', icon: <CodeOutlined /> },
  VIEWER:        { label: 'Viewer',         color: '#344563', bg: '#ebecf0', icon: <EyeOutlined /> },
};

function canEditProject(role: ProjectRole | null)  { return role === 'PROJECT_ADMIN'; }
function canDeleteProject(role: ProjectRole | null) { return role === 'PROJECT_ADMIN'; }
function canInviteMembers(role: ProjectRole | null) { return role === 'PROJECT_ADMIN'; }

// ── Mock Kanban (unchanged from original) ────────────────────────────────────
const buildMockTasks = (projectKey: string) => ({
  todo: [
    { id: '1', title: 'Set up project database schema & multitenancy support', key: `${projectKey}-1`, priority: 'High' },
    { id: '2', title: 'Configure client-side Axios route interceptors',        key: `${projectKey}-2`, priority: 'Medium' },
  ],
  inProgress: [
    { id: '3', title: 'Overhaul authentication token payload decoders', key: `${projectKey}-3`, priority: 'High' },
  ],
  done: [
    { id: '4', title: 'Install Ant Design UI and basic reset stylesheets', key: `${projectKey}-4`, priority: 'Low' },
  ],
});

// ─────────────────────────────────────────────────────────────────────────────

const ProjectPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Project state
  const [project, setProject]   = useState<Project | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Members state
  const [members, setMembers]             = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError]   = useState<string | null>(null);

  // Current user's role in this project
  const [myRole, setMyRole] = useState<ProjectRole | null>(null);

  // Modal states
  const [editModalOpen,   setEditModalOpen]   = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // ── Fetch project ────────────────────────────────────────────────────────
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

  // ── Fetch members ────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    try {
      setMembersLoading(true);
      setMembersError(null);
      const res = await axiosInstance.get<ProjectMember[]>(`/projects/${projectId}/members`);
      setMembers(res.data);

      // Derive current user's role
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

  useEffect(() => {
    fetchProject();
    fetchMembers();
  }, [fetchProject, fetchMembers]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
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

  const handleEditSuccess = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  const handleInviteSuccess = () => {
    setInviteModalOpen(false);
    fetchMembers();
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
        <ErrorState message="Project details could not be found." onRetry={fetchProject} />
      </div>
    );
  }

  const mockTasks = buildMockTasks(project.key);
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
          <Title level={2} className={styles.projectTitle}>
            {project.name}
          </Title>
          <span className={styles.projectKeyTag}>{project.key}</span>

          {/* Current user's role badge */}
          {roleConfig && (
            <Tag
              icon={roleConfig.icon}
              className={styles.myRoleBadge}
              style={{
                color: roleConfig.color,
                backgroundColor: roleConfig.bg,
                border: 'none',
              }}
            >
              {roleConfig.label}
            </Tag>
          )}
        </div>

        <div className={styles.actionsContainer}>
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
              Edit Details
            </Button>
          )}
          {canDeleteProject(myRole) && (
            <Popconfirm
              title="Delete Project"
              description={`Are you sure you want to delete "${project.name}"? This cannot be undone.`}
              onConfirm={handleDelete}
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

      {/* Main Layout */}
      <Row gutter={[24, 24]}>
        {/* Left: Description + Kanban */}
        <Col xs={24} lg={17}>
          <div className={styles.mainCard}>
            <h4 className={styles.sectionTitle}>
              <InfoCircleOutlined className={styles.sectionIcon} />
              Description
            </h4>
            <div className={styles.descriptionBox}>
              <Text>{project.description || 'No description provided for this project.'}</Text>
            </div>
          </div>

          {/* Kanban board */}
          <div className={styles.issuesContainer}>
            <h4 className={styles.sectionTitle}>
              <UnorderedListOutlined className={styles.sectionIcon} />
              Issues Board
            </h4>
            <div className={styles.kanbanBoard}>
              {/* To Do */}
              <div className={styles.kanbanColumn}>
                <div className={styles.columnHeader}>
                  <span className={styles.columnTitle}>To Do</span>
                  <Badge count={mockTasks.todo.length} style={{ backgroundColor: '#dfe1e6', color: '#42526e' }} />
                </div>
                {mockTasks.todo.map((task) => (
                  <div className={styles.taskCard} key={task.id}>
                    <p className={styles.taskTitle}>{task.title}</p>
                    <div className={styles.taskFooter}>
                      <span className={styles.taskKey}>{task.key}</span>
                      <span className={styles.taskPriority}>
                        <ArrowUpOutlined style={{ color: '#de350b', marginRight: 4 }} />
                        <Text type="secondary">{task.priority}</Text>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* In Progress */}
              <div className={styles.kanbanColumn}>
                <div className={styles.columnHeader}>
                  <span className={styles.columnTitle}>In Progress</span>
                  <Badge count={mockTasks.inProgress.length} style={{ backgroundColor: '#deebff', color: '#0052cc' }} />
                </div>
                {mockTasks.inProgress.map((task) => (
                  <div className={styles.taskCard} key={task.id}>
                    <p className={styles.taskTitle}>{task.title}</p>
                    <div className={styles.taskFooter}>
                      <span className={styles.taskKey}>{task.key}</span>
                      <span className={styles.taskPriority}>
                        <ArrowUpOutlined style={{ color: '#ff991f', marginRight: 4 }} />
                        <Text type="secondary">{task.priority}</Text>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Done */}
              <div className={styles.kanbanColumn}>
                <div className={styles.columnHeader}>
                  <span className={styles.columnTitle}>Done</span>
                  <Badge count={mockTasks.done.length} style={{ backgroundColor: '#e3fcef', color: '#00875a' }} />
                </div>
                {mockTasks.done.map((task) => (
                  <div className={styles.taskCard} key={task.id}>
                    <p className={styles.taskTitle}>{task.title}</p>
                    <div className={styles.taskFooter}>
                      <span className={styles.taskKey}>{task.key}</span>
                      <span className={styles.taskPriority}>
                        <MinusOutlined style={{ color: '#00875a', marginRight: 4 }} />
                        <Text type="secondary">{task.priority}</Text>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Col>

        {/* Right: Sidebar */}
        <Col xs={24} lg={7}>
          <div className={styles.rightSidebar}>
            {/* Details Card */}
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

            {/* Team Members Card */}
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
                  action={
                    <Button size="small" onClick={fetchMembers}>
                      Retry
                    </Button>
                  }
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

      {/* Modals */}
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
    </div>
  );
};

export default ProjectPage;
