import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Typography, Button, Popconfirm, Breadcrumb, Row, Col, Avatar, Tooltip, Badge, message } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  TeamOutlined, 
  InfoCircleOutlined, 
  UnorderedListOutlined, 
  PlusOutlined,
  ArrowUpOutlined,
  MinusOutlined
} from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { Project } from '../../types/project';
import PageLoader from '../../components/common/PageLoader';
import ErrorState from '../../components/common/ErrorState';
import EditProjectModal from '../../components/project/EditProjectModal';
import styles from './ProjectPage.module.css';

const { Title, Text } = Typography;

const ProjectPage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Modal states
    const [editModalOpen, setEditModalOpen] = useState(false);

    const fetchProject = async () => {
        if (!projectId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get<Project>(`/projects/${projectId}`);
            setProject(response.data);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to load project details';
            setError(msg);
            setProject(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [projectId]);

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

    if (loading && !project) {
        return <PageLoader />;
    }

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

    // Mock Kanban Data
    const mockTasks = {
        todo: [
            { id: '1', title: 'Set up project database schema & multitenancy support', key: `${project.key}-1`, priority: 'High' },
            { id: '2', title: 'Configure client-side Axios route interceptors', key: `${project.key}-2`, priority: 'Medium' }
        ],
        inProgress: [
            { id: '3', title: 'Overhaul authentication token payload decoders', key: `${project.key}-3`, priority: 'High' }
        ],
        done: [
            { id: '4', title: 'Install Ant Design UI and basic reset stylesheets', key: `${project.key}-4`, priority: 'Low' }
        ]
    };

    // Mock Team Members
    const mockMembers = [
        { name: 'John Doe', initials: 'JD', email: 'john.doe@atlassian.com', color: '#5243aa' },
        { name: 'Abhinandan Mishra', initials: 'AM', email: 'owner@jira-clone.com', color: '#0052cc' },
        { name: 'Sarah Rogers', initials: 'SR', email: 'sarah.r@jira-clone.com', color: '#00875a' },
        { name: 'Bruce Kent', initials: 'BK', email: 'bruce.k@jira-clone.com', color: '#de350b' }
    ];

    const projectCreatedDate = new Date(project.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className={styles.container}>
            {/* Breadcrumb Header */}
            <div className={styles.breadcrumbContainer}>
                <Breadcrumb
                    items={[
                        {
                            title: <Link to="/dashboard">Dashboard</Link>,
                        },
                        {
                            title: project.name,
                        },
                    ]}
                />
            </div>

            {/* Page Header (Actions and Title) */}
            <div className={styles.headerRow}>
                <div className={styles.titleSection}>
                    <Title level={2} className={styles.projectTitle}>
                        {project.name}
                    </Title>
                    <span className={styles.projectKeyTag}>{project.key}</span>
                </div>

                <div className={styles.actionsContainer}>
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => setEditModalOpen(true)}
                        className={styles.editBtn}
                    >
                        Edit Details
                    </Button>
                    <Popconfirm
                        title="Delete Project"
                        description={`Are you sure you want to delete ${project.name}? This action cannot be undone.`}
                        onConfirm={handleDelete}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true, loading }}
                    >
                        <Button 
                            type="primary" 
                            danger 
                            icon={<DeleteOutlined />}
                            className={styles.deleteBtn}
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </div>
            </div>

            {/* Main Content Layout Grid */}
            <Row gutter={[24, 24]}>
                {/* Left Side: Description & Kanban board */}
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

                    {/* Dedicated Issues Kanban board Section */}
                    <div className={styles.issuesContainer}>
                        <h4 className={styles.sectionTitle}>
                            <UnorderedListOutlined className={styles.sectionIcon} />
                            Issues Board
                        </h4>

                        <div className={styles.kanbanBoard}>
                            {/* Column: To Do */}
                            <div className={styles.kanbanColumn}>
                                <div className={styles.columnHeader}>
                                    <span className={styles.columnTitle}>To Do</span>
                                    <Badge count={mockTasks.todo.length} style={{ backgroundColor: '#dfe1e6', color: '#42526e' }} />
                                </div>
                                {mockTasks.todo.map(task => (
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

                            {/* Column: In Progress */}
                            <div className={styles.kanbanColumn}>
                                <div className={styles.columnHeader}>
                                    <span className={styles.columnTitle}>In Progress</span>
                                    <Badge count={mockTasks.inProgress.length} style={{ backgroundColor: '#deebff', color: '#0052cc' }} />
                                </div>
                                {mockTasks.inProgress.map(task => (
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

                            {/* Column: Done */}
                            <div className={styles.kanbanColumn}>
                                <div className={styles.columnHeader}>
                                    <span className={styles.columnTitle}>Done</span>
                                    <Badge count={mockTasks.done.length} style={{ backgroundColor: '#e3fcef', color: '#00875a' }} />
                                </div>
                                {mockTasks.done.map(task => (
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

                {/* Right Side: Details Sidebar & Members placeholder */}
                <Col xs={24} lg={7}>
                    <div className={styles.rightSidebar}>
                        {/* Sidebar: Details metadata panel */}
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
                                    <span className={styles.metaLabel}>Project Lead</span>
                                    <span className={styles.metaValue}>
                                        <Tooltip title="Abhinandan Mishra (Lead Owner)">
                                            <Avatar size="small" style={{ backgroundColor: '#0052cc', marginRight: 8 }}>AM</Avatar>
                                            <Text type="secondary">Abhinandan</Text>
                                        </Tooltip>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Teammates Placeholder */}
                        <div className={styles.sidebarCard}>
                            <h4 className={styles.sidebarTitle}>
                                <TeamOutlined className={styles.sidebarIcon} />
                                Teammates
                            </h4>
                            
                            <div className={styles.memberAvatars}>
                                <Avatar.Group max={{ count: 3, style: { color: '#f56a00', backgroundColor: '#fde3cf' } }}>
                                    {mockMembers.map((m, idx) => (
                                        <Tooltip title={`${m.name} (${m.email})`} key={idx}>
                                            <Avatar 
                                                style={{ backgroundColor: m.color }} 
                                                className={styles.memberAvatarItem}
                                            >
                                                {m.initials}
                                            </Avatar>
                                        </Tooltip>
                                    ))}
                                </Avatar.Group>
                                <Tooltip title="Add future members (users feature)">
                                    <Button 
                                        shape="circle" 
                                        icon={<PlusOutlined />} 
                                        size="small" 
                                        style={{ marginLeft: 8 }}
                                    />
                                </Tooltip>
                            </div>

                            <p className={styles.memberPlaceholderText}>
                                This section prepares for future project user features. You will be able to invite teammates and assign specific scoping rights.
                            </p>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Modal components */}
            <EditProjectModal 
                open={editModalOpen} 
                project={project} 
                onCancel={() => setEditModalOpen(false)}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
};

export default ProjectPage;
