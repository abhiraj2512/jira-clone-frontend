import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Avatar,
  Tag,
  Skeleton,
  notification,
  Tooltip,
  Divider,
  Popconfirm,
  Tabs,
} from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
  FlagOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { Issue, IssueStatus } from '../../types/issue';
import { PRIORITY_CONFIG, STATUS_LABELS } from '../../types/issue';
import type { ProjectMember, ProjectRole } from '../../types/project';
import { useAuth } from '../../context/AuthContext';
import IssueComments from './IssueComments';
import IssueActivityTimeline from './IssueActivityTimeline';
import styles from './IssueDrawer.module.css';

const { TextArea } = Input;
const { Option } = Select;

const TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  TODO:        ['IN_PROGRESS'],
  IN_PROGRESS: ['DONE', 'TODO'],
  DONE:        ['IN_PROGRESS'],
};

interface IssueDrawerProps {
  issueId: string | null;
  members: ProjectMember[];
  myRole: ProjectRole | null;
  onClose: () => void;
  onIssueUpdated: (updatedIssue: Issue) => void;
  onIssueStatusChanged: (issueId: string, newStatus: IssueStatus) => void;
  onIssueDeleted: (issueId: string) => void;
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

function fmt(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function canEdit(role: ProjectRole | null) {
  return role === 'PROJECT_ADMIN' || role === 'DEVELOPER';
}

const IssueDrawer: React.FC<IssueDrawerProps> = ({
  issueId,
  members,
  myRole,
  onClose,
  onIssueUpdated,
  onIssueStatusChanged,
  onIssueDeleted,
}) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [issue, setIssue]               = useState<Issue | null>(null);
  const [loading, setLoading]           = useState(false);
  const [editMode, setEditMode]         = useState(false);
  const [saving, setSaving]             = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [activeTab, setActiveTab]       = useState('comments');
  const [activityTrigger, setActivityTrigger] = useState(0);

  const refreshActivity = useCallback(() => {
    setActivityTrigger((t) => t + 1);
  }, []);

  const fetchIssue = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    setIssue(null);
    setEditMode(false);
    setActiveTab('comments');
    try {
      const res = await axiosInstance.get<Issue>(`/issues/${issueId}`);
      setIssue(res.data);
      form.setFieldsValue({
        title:       res.data.title,
        description: res.data.description || '',
        priority:    res.data.priority,
        assigneeId:  res.data.assigneeId || undefined,
      });
    } catch (err: any) {
      notification.error({
        message: 'Failed to load issue',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  }, [issueId, form]);

  useEffect(() => {
    if (issueId) fetchIssue();
  }, [issueId, fetchIssue]);

  const handleSave = async () => {
    if (!issue) return;
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload: Record<string, unknown> = {};
      if (values.title !== issue.title) payload.title = values.title.trim();
      if ((values.description || '') !== (issue.description || '')) {
        payload.description = values.description || '';
      }
      if (values.priority !== issue.priority) payload.priority = values.priority;
      const newAssignee = values.assigneeId || null;
      if (newAssignee !== issue.assigneeId) payload.assigneeId = newAssignee;

      if (Object.keys(payload).length === 0) {
        setEditMode(false);
        return;
      }

      const res = await axiosInstance.patch<Issue>(`/issues/${issue.id}`, payload);
      setIssue(res.data);
      form.setFieldsValue({
        title:       res.data.title,
        description: res.data.description || '',
        priority:    res.data.priority,
        assigneeId:  res.data.assigneeId || undefined,
      });
      setEditMode(false);
      onIssueUpdated(res.data);
      refreshActivity();

      notification.success({
        message: 'Issue Updated',
        description: 'Changes saved successfully.',
        placement: 'topRight',
      });
    } catch (err: any) {
      if (err?.errorFields) return;
      notification.error({
        message: 'Save Failed',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (issue) {
      form.setFieldsValue({
        title:       issue.title,
        description: issue.description || '',
        priority:    issue.priority,
        assigneeId:  issue.assigneeId || undefined,
      });
    }
    setEditMode(false);
  };

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue) return;
    setStatusUpdating(true);
    try {
      await axiosInstance.patch(`/issues/${issue.id}/status`, { status: newStatus });
      setIssue((prev) => prev ? { ...prev, status: newStatus } : prev);
      onIssueStatusChanged(issue.id, newStatus);
      refreshActivity();
      notification.success({
        message: 'Status Updated',
        description: `Moved to "${STATUS_LABELS[newStatus]}"`,
        placement: 'topRight',
      });
    } catch (err: any) {
      notification.error({
        message: 'Status Update Failed',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!issue) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/issues/${issue.id}`);
      notification.success({
        message: 'Issue Deleted',
        description: `"${issue.title}" has been deleted.`,
        placement: 'topRight',
      });
      onIssueDeleted(issue.id);
      onClose();
    } catch (err: any) {
      notification.error({
        message: 'Delete Failed',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getMember = (userId: string | null | undefined) =>
    userId ? members.find((m) => m.userId === userId) : null;

  const isEditable = canEdit(myRole);
  const isViewer   = myRole === 'VIEWER';

  const allowedStatuses  = issue ? TRANSITIONS[issue.status] : [];
  const statusOptions: IssueStatus[] = issue
    ? ([issue.status, ...allowedStatuses] as IssueStatus[])
    : [];

  const priorityConf = issue ? PRIORITY_CONFIG[issue.priority] : null;

  const tabItems = issueId && issue ? [
    {
      key: 'comments',
      label: (
        <span>
          <MessageOutlined style={{ marginRight: 4 }} />
          Comments
        </span>
      ),
      children: (
        <IssueComments
          issueId={issueId}
          myRole={myRole}
          currentUserId={user?.id ?? ''}
          onCommentChange={refreshActivity}
        />
      ),
    },
    {
      key: 'activity',
      label: (
        <span>
          <HistoryOutlined style={{ marginRight: 4 }} />
          Activity
        </span>
      ),
      children: (
        <IssueActivityTimeline
          issueId={issueId}
          refreshTrigger={activityTrigger}
        />
      ),
    },
  ] : [];

  return (
    <Drawer
      open={!!issueId}
      onClose={() => { setEditMode(false); onClose(); }}
      width={580}
      title={null}
      closable={false}
      bodyStyle={{ padding: 0 }}
      destroyOnClose
    >
      {loading ? (
        <div className={styles.loadingWrapper}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      ) : issue ? (
        <div className={styles.drawerContent}>
          {/* Header */}
          <div className={styles.drawerHeader}>
            <div className={styles.headerLeft}>
              <span className={styles.issueKeyChip}>
                {issue.issueKey || issue.id.slice(0, 8).toUpperCase()}
              </span>
              {priorityConf && (
                <span
                  className={styles.priorityChip}
                  style={{ color: priorityConf.color, background: priorityConf.bg }}
                >
                  <FlagOutlined />
                  {priorityConf.label}
                </span>
              )}
            </div>
            <div className={styles.headerActions}>
              {isEditable && !editMode && (
                <Tooltip title="Edit issue">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => setEditMode(true)}
                    className={styles.iconBtn}
                  />
                </Tooltip>
              )}
              {editMode && (
                <>
                  <Button
                    size="small"
                    onClick={handleCancelEdit}
                    icon={<CloseOutlined />}
                    className={styles.cancelEditBtn}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    loading={saving}
                    onClick={handleSave}
                    icon={<SaveOutlined />}
                    className={styles.saveBtn}
                  >
                    Save
                  </Button>
                </>
              )}
              <Tooltip title="Close">
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => { setEditMode(false); onClose(); }}
                  className={styles.iconBtn}
                />
              </Tooltip>
            </div>
          </div>

          {/* Form / View */}
          <div className={styles.body}>
            <Form form={form} layout="vertical">
              {/* Title */}
              <Form.Item
                name="title"
                label={<span className={styles.fieldLabel}>Title</span>}
                rules={[{ required: true, message: 'Title is required' }]}
              >
                {editMode ? (
                  <Input
                    style={{ borderRadius: 6, fontWeight: 600 }}
                    maxLength={255}
                    size="large"
                  />
                ) : (
                  <h3 className={styles.issueTitle}>{issue.title}</h3>
                )}
              </Form.Item>

              {/* Description */}
              <Form.Item
                name="description"
                label={<span className={styles.fieldLabel}>Description</span>}
              >
                {editMode ? (
                  <TextArea rows={5} style={{ borderRadius: 6 }} />
                ) : (
                  <p className={styles.issueDesc}>
                    {issue.description || (
                      <span className={styles.noDescription}>No description provided.</span>
                    )}
                  </p>
                )}
              </Form.Item>

              <Divider style={{ margin: '8px 0 16px' }} />

              {/* Metadata grid */}
              <div className={styles.metaGrid}>
                {/* Status */}
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>
                    <CheckCircleOutlined /> Status
                  </span>
                  <div className={styles.metaValue}>
                    <Select
                      value={issue.status}
                      onChange={handleStatusChange}
                      loading={statusUpdating}
                      disabled={isViewer || statusUpdating}
                      style={{ width: 160, borderRadius: 6 }}
                      size="small"
                    >
                      {statusOptions.map((s) => (
                        <Option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </Option>
                      ))}
                    </Select>
                    {isViewer && (
                      <span className={styles.viewerNote}>Read-only</span>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>
                    <FlagOutlined /> Priority
                  </span>
                  <div className={styles.metaValue}>
                    {editMode ? (
                      <Form.Item name="priority" noStyle>
                        <Select size="small" style={{ width: 140 }}>
                          <Option value="HIGH">
                            <span style={{ color: '#de350b', fontWeight: 600 }}>▲ High</span>
                          </Option>
                          <Option value="MEDIUM">
                            <span style={{ color: '#ff991f', fontWeight: 600 }}>■ Medium</span>
                          </Option>
                          <Option value="LOW">
                            <span style={{ color: '#36b37e', fontWeight: 600 }}>▼ Low</span>
                          </Option>
                        </Select>
                      </Form.Item>
                    ) : (
                      priorityConf && (
                        <Tag
                          style={{
                            color: priorityConf.color,
                            background: priorityConf.bg,
                            border: 'none',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {priorityConf.label}
                        </Tag>
                      )
                    )}
                  </div>
                </div>

                {/* Assignee */}
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>
                    <UserOutlined /> Assignee
                  </span>
                  <div className={styles.metaValue}>
                    {editMode ? (
                      <Form.Item name="assigneeId" noStyle>
                        <Select
                          size="small"
                          style={{ width: 200 }}
                          placeholder="Unassigned"
                          allowClear
                          optionLabelProp="label"
                        >
                          {members.map((m) => (
                            <Option
                              key={m.userId}
                              value={m.userId}
                              label={m.fullName || m.email}
                            >
                              <div className={styles.assigneeOpt}>
                                <Avatar
                                  size={16}
                                  style={{
                                    backgroundColor: getAvatarColor(m.userId),
                                    fontSize: 8,
                                    fontWeight: 700,
                                  }}
                                >
                                  {getInitials(m.fullName, m.email)}
                                </Avatar>
                                <span>{m.fullName || m.email}</span>
                              </div>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    ) : (
                      (() => {
                        const assignee = getMember(issue.assigneeId);
                        return assignee ? (
                          <div className={styles.personChip}>
                            <Avatar
                              size={22}
                              style={{
                                backgroundColor: getAvatarColor(assignee.userId),
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              {getInitials(assignee.fullName, assignee.email)}
                            </Avatar>
                            <span>{assignee.fullName || assignee.email}</span>
                          </div>
                        ) : (
                          <span className={styles.unassigned}>Unassigned</span>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Reporter */}
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>
                    <UserOutlined /> Reporter
                  </span>
                  <div className={styles.metaValue}>
                    {(() => {
                      const reporter = getMember(issue.reporterId);
                      return reporter ? (
                        <div className={styles.personChip}>
                          <Avatar
                            size={22}
                            style={{
                              backgroundColor: getAvatarColor(reporter.userId),
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {getInitials(reporter.fullName, reporter.email)}
                          </Avatar>
                          <span>{reporter.fullName || reporter.email}</span>
                        </div>
                      ) : (
                        <span className={styles.unassigned}>—</span>
                      );
                    })()}
                  </div>
                </div>

                {/* Created */}
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>
                    <CalendarOutlined /> Created
                  </span>
                  <span className={styles.metaValue}>{fmt(issue.createdAt)}</span>
                </div>

                {/* Updated */}
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>
                    <CalendarOutlined /> Updated
                  </span>
                  <span className={styles.metaValue}>{fmt(issue.updatedAt)}</span>
                </div>
              </div>
            </Form>
          </div>

          {/* Comments + Activity Tabs */}
          <div className={styles.tabsSection}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="small"
              className={styles.drawerTabs}
              items={tabItems}
            />
          </div>

          {/* Footer: Delete (PROJECT_ADMIN only) */}
          {myRole === 'PROJECT_ADMIN' && (
            <div className={styles.drawerFooter}>
              <Popconfirm
                title="Delete Issue"
                description={`Are you sure you want to delete "${issue?.title}"? This cannot be undone.`}
                onConfirm={handleDelete}
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true, loading: deleting }}
                placement="topLeft"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={deleting}
                  className={styles.deleteBtn}
                >
                  Delete Issue
                </Button>
              </Popconfirm>
            </div>
          )}
        </div>
      ) : null}
    </Drawer>
  );
};

export default IssueDrawer;
