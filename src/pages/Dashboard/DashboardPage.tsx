import React, { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Typography,
  Empty,
  Card,
  Statistic,
  Skeleton,
} from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UnorderedListOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import type { Project } from '../../types/project';
import type { IssueSummary } from '../../types/issue';
import PageLoader from '../../components/common/PageLoader';
import ErrorState from '../../components/common/ErrorState';
import styles from './DashboardPage.module.css';

const { Title, Text } = Typography;

interface IssueStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [issueStats, setIssueStats] = useState<IssueStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<Project[]>('/projects');
      setProjects(response.data);
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load projects';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIssueStats = useCallback(async (projectList: Project[]) => {
    if (projectList.length === 0) {
      setIssueStats({ total: 0, todo: 0, inProgress: 0, done: 0 });
      return;
    }
    setStatsLoading(true);
    try {
      // Fetch all project issues in parallel
      const results = await Promise.allSettled(
        projectList.map((p) =>
          axiosInstance
            .get<IssueSummary[]>(`/projects/${p.id}/issues`)
            .then((r) => r.data),
        ),
      );

      const allIssues: IssueSummary[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allIssues.push(...result.value);
        }
      }

      setIssueStats({
        total:      allIssues.length,
        todo:       allIssues.filter((i) => i.status === 'TODO').length,
        inProgress: allIssues.filter((i) => i.status === 'IN_PROGRESS').length,
        done:       allIssues.filter((i) => i.status === 'DONE').length,
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects().then((list) => fetchIssueStats(list));

    const handleProjectCreated = () => {
      fetchProjects().then((list) => fetchIssueStats(list));
    };

    window.addEventListener('project-created', handleProjectCreated);
    return () => window.removeEventListener('project-created', handleProjectCreated);
  }, [fetchProjects, fetchIssueStats]);

  const handleProjectClick = (id: string) => {
    navigate(`/projects/${id}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <Title level={2} className={styles.pageTitle}>Dashboard</Title>
        <Text className={styles.pageSubtitle}>
          Track your projects, monitor issue progress, and stay on top of your work.
        </Text>
      </div>

      {!loading && !error && (
        <div className={styles.statsSection}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={`${styles.statsCard} ${styles.statsCardProjects}`}>
                <div className={styles.statsIcon}>
                  <ProjectOutlined />
                </div>
                <Statistic
                  title="Total Projects"
                  value={projects.length}
                  valueStyle={{ fontSize: 28, fontWeight: 800, color: '#172b4d' }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={`${styles.statsCard} ${styles.statsCardTotal}`}>
                <div className={styles.statsIcon} style={{ color: '#5243aa' }}>
                  <UnorderedListOutlined />
                </div>
                {statsLoading ? (
                  <Skeleton.Input active size="small" style={{ width: 60, marginTop: 8 }} />
                ) : (
                  <Statistic
                    title="Total Issues"
                    value={issueStats?.total ?? 0}
                    valueStyle={{ fontSize: 28, fontWeight: 800, color: '#5243aa' }}
                  />
                )}
              </div>
            </Col>

            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={`${styles.statsCard} ${styles.statsCardTodo}`}>
                <div className={styles.statsIcon} style={{ color: '#5e6c84' }}>
                  <UnorderedListOutlined />
                </div>
                {statsLoading ? (
                  <Skeleton.Input active size="small" style={{ width: 60, marginTop: 8 }} />
                ) : (
                  <Statistic
                    title="To Do"
                    value={issueStats?.todo ?? 0}
                    valueStyle={{ fontSize: 28, fontWeight: 800, color: '#5e6c84' }}
                  />
                )}
              </div>
            </Col>

            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={`${styles.statsCard} ${styles.statsCardProgress}`}>
                <div className={styles.statsIcon} style={{ color: '#0052cc' }}>
                  <PlayCircleOutlined />
                </div>
                {statsLoading ? (
                  <Skeleton.Input active size="small" style={{ width: 60, marginTop: 8 }} />
                ) : (
                  <Statistic
                    title="In Progress"
                    value={issueStats?.inProgress ?? 0}
                    valueStyle={{ fontSize: 28, fontWeight: 800, color: '#0052cc' }}
                  />
                )}
              </div>
            </Col>

            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={`${styles.statsCard} ${styles.statsCardDone}`}>
                <div className={styles.statsIcon} style={{ color: '#00875a' }}>
                  <CheckCircleOutlined />
                </div>
                {statsLoading ? (
                  <Skeleton.Input active size="small" style={{ width: 60, marginTop: 8 }} />
                ) : (
                  <Statistic
                    title="Done"
                    value={issueStats?.done ?? 0}
                    valueStyle={{ fontSize: 28, fontWeight: 800, color: '#00875a' }}
                  />
                )}
              </div>
            </Col>

            <Col xs={12} sm={8} md={6} lg={4}>
              <div className={`${styles.statsCard} ${styles.statsCardRate}`}>
                <div className={styles.statsIcon} style={{ color: '#ff991f' }}>
                  <ClockCircleOutlined />
                </div>
                {statsLoading ? (
                  <Skeleton.Input active size="small" style={{ width: 60, marginTop: 8 }} />
                ) : (
                  <Statistic
                    title="Completion"
                    value={
                      issueStats && issueStats.total > 0
                        ? Math.round((issueStats.done / issueStats.total) * 100)
                        : 0
                    }
                    suffix="%"
                    valueStyle={{ fontSize: 28, fontWeight: 800, color: '#ff991f' }}
                  />
                )}
              </div>
            </Col>
          </Row>
        </div>
      )}

      <div className={styles.projectsSection}>
        <div className={styles.sectionHeader}>
          <Title level={4} className={styles.sectionTitle}>
            <ProjectOutlined style={{ marginRight: 8, color: '#0052cc' }} />
            Projects
          </Title>
        </div>

        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchProjects().then((l) => fetchIssueStats(l))} />
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
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleProjectClick(project.id)}
                  aria-label={`Open project: ${project.name}`}
                >
                  <Card
                    bordered={false}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}
                    styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' } }}
                  >
                    <div className={styles.cardAccentBar} />
                    <div className={styles.cardBody}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
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
                          Created: {new Date(project.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </span>
                        <span className={styles.viewLink}>View →</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
