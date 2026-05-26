import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Empty, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import type { Project } from '../../types/project';
import PageLoader from '../../components/common/PageLoader';
import ErrorState from '../../components/common/ErrorState';
import styles from './DashboardPage.module.css';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get('/projects');
            setProjects(response.data);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to load projects';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();

        // Listen for the project-created custom event emitted by the global AppHeader Modal
        const handleProjectCreated = () => {
            fetchProjects();
        };

        window.addEventListener('project-created', handleProjectCreated);
        return () => {
            window.removeEventListener('project-created', handleProjectCreated);
        };
    }, []);

    const handleProjectClick = (id: string) => {
        navigate(`/projects/${id}`);
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerSection}>
                <Title level={2} className={styles.pageTitle}>Projects</Title>
                <Text className={styles.pageSubtitle}>View, manage, and click into your active project directories.</Text>
            </div>

            {loading ? (
                <PageLoader />
            ) : error ? (
                <ErrorState message={error} onRetry={fetchProjects} />
            ) : projects.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <Empty description="No projects found. Click 'Create Project' in the header to get started!" />
                </div>
            ) : (
                <Row gutter={[24, 24]} className={styles.cardGrid}>
                    {projects.map((project) => (
                        <Col xs={24} sm={12} md={8} lg={8} xl={6} key={project.id}>
                            <div 
                                className={styles.projectCard}
                                onClick={() => handleProjectClick(project.id)}
                            >
                                <Card
                                    bordered={false}
                                    style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}
                                    styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' } }}
                                >
                                    <div className={styles.cardBody}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <span className={styles.projectCardTitle}>{project.name}</span>
                                            <span className={styles.projectKey}>{project.key}</span>
                                        </div>
                                        
                                        <div className={styles.descriptionWrapper}>
                                            <p className={styles.description}>
                                                {project.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        
                                        <div className={styles.cardFooter}>
                                            <span className={styles.dateText}>
                                                Created: {new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default DashboardPage;
