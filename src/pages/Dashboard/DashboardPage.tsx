import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, message, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const { Title, Text } = Typography;

interface Project {
    id: string;
    name: string;
    key: string;
    description: string;
    createdAt: string;
}

const DashboardPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        
        const fetchProjects = async () => {
            try {
                const response = await axiosInstance.get('/projects');
                if (isMounted) {
                    setProjects(response.data);
                }
            } catch (error: any) {
                if (isMounted) {
                    message.error(error.response?.data?.message || 'Failed to load projects');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProjects();
        
        return () => {
            isMounted = false;
        };
    }, []);

    const handleProjectClick = (id: string) => {
        navigate(`/projects/${id}`);
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>Dashboard</Title>
                <Text type="secondary">View and manage your projects.</Text>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                    <Spin size="large" />
                </div>
            ) : projects.length === 0 ? (
                <div style={{ padding: '40px 0' }}>
                    <Empty description="No projects found" />
                </div>
            ) : (
                <Row gutter={[24, 24]}>
                    {projects.map((project) => (
                        <Col xs={24} sm={12} md={8} lg={8} key={project.id}>
                            <Card
                                hoverable
                                onClick={() => handleProjectClick(project.id)}
                                title={project.name}
                                extra={<Text keyboard>{project.key}</Text>}
                                style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                                styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
                            >
                                <div style={{ flex: 1, marginBottom: '16px' }}>
                                    <Text type="secondary">
                                        {project.description || 'No description provided.'}
                                    </Text>
                                </div>
                                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
                                    <Text type="secondary" style={{ fontSize: '13px' }}>
                                        Created: {new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </Text>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default DashboardPage;
