import React, { useState, useRef, useEffect } from 'react';
import {
  Avatar,
  Button,
  Input,
  Popconfirm,
  Skeleton,
  notification,
  Tooltip,
} from 'antd';
import {
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../api/axios';
import type { Comment } from '../../types/comment';
import type { ProjectRole } from '../../types/project';
import styles from './IssueComments.module.css';

const { TextArea } = Input;

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

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface IssueCommentsProps {
  issueId: string;
  myRole: ProjectRole | null;
  currentUserId: string;
  onCommentChange: () => void; // to refresh activity
}

const IssueComments: React.FC<IssueCommentsProps> = ({
  issueId,
  myRole,
  currentUserId,
  onCommentChange,
}) => {
  const [comments, setComments]       = useState<Comment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [newContent, setNewContent]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editSaving, setEditSaving]   = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const canComment = myRole === 'PROJECT_ADMIN' || myRole === 'DEVELOPER';

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<Comment[]>(`/issues/${issueId}/comments`);
      setComments(res.data);
    } catch (err: any) {
      notification.error({
        message: 'Failed to load comments',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) fetchComments();
  }, [issueId]);

  const handleSubmit = async () => {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      notification.warning({ message: 'Comment cannot exceed 2000 characters', placement: 'topRight' });
      return;
    }
    try {
      setSubmitting(true);
      const res = await axiosInstance.post<Comment>(`/issues/${issueId}/comments`, { content: trimmed });
      setComments((prev) => [...prev, res.data]);
      setNewContent('');
      onCommentChange();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      notification.error({
        message: 'Failed to post comment',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (commentId: string) => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    try {
      setEditSaving(true);
      const res = await axiosInstance.patch<Comment>(`/comments/${commentId}`, { content: trimmed });
      setComments((prev) => prev.map((c) => (c.id === commentId ? res.data : c)));
      setEditingId(null);
      setEditContent('');
      onCommentChange();
      notification.success({ message: 'Comment updated', placement: 'topRight' });
    } catch (err: any) {
      notification.error({
        message: 'Failed to update comment',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      setDeletingId(commentId);
      await axiosInstance.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentChange();
      notification.success({ message: 'Comment deleted', placement: 'topRight' });
    } catch (err: any) {
      notification.error({
        message: 'Failed to delete comment',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.skeleton}>
        {[1, 2].map((i) => (
          <div key={i} className={styles.skeletonItem}>
            <Skeleton.Avatar active size={32} />
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {comments.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>💬</span>
          <p>No comments yet.</p>
          {canComment && <p className={styles.emptyHint}>Be the first to comment!</p>}
        </div>
      ) : (
        <div className={styles.list}>
          {comments.map((comment) => {
            const isOwn  = comment.userId === currentUserId;
            const isAdmin = myRole === 'PROJECT_ADMIN';
            const canEdit   = isOwn && canComment;
            const canDelete = isOwn || isAdmin;
            const isEditing = editingId === comment.id;

            return (
              <div key={comment.id} className={styles.commentRow}>
                <Avatar
                  size={32}
                  className={styles.avatar}
                  style={{ backgroundColor: getAvatarColor(comment.userId), fontSize: 11, fontWeight: 700 }}
                >
                  {getInitials(comment.author.fullName, comment.author.email)}
                </Avatar>

                <div className={styles.commentBody}>
                  <div className={styles.commentHeader}>
                    <span className={styles.authorName}>
                      {comment.author.fullName || comment.author.email}
                    </span>
                    <span className={styles.timestamp}>
                      <Tooltip title={new Date(comment.createdAt).toLocaleString()}>
                        {relativeTime(comment.createdAt)}
                        {comment.updatedAt !== comment.createdAt && (
                          <span className={styles.edited}> (edited)</span>
                        )}
                      </Tooltip>
                    </span>
                    <div className={styles.actions}>
                      {canEdit && !isEditing && (
                        <Tooltip title="Edit">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => startEdit(comment)}
                            className={styles.actionBtn}
                          />
                        </Tooltip>
                      )}
                      {canDelete && !isEditing && (
                        <Popconfirm
                          title="Delete comment?"
                          description="This action cannot be undone."
                          onConfirm={() => handleDelete(comment.id)}
                          okText="Delete"
                          okButtonProps={{ danger: true, loading: deletingId === comment.id }}
                          cancelText="Cancel"
                        >
                          <Tooltip title="Delete">
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                              loading={deletingId === comment.id}
                            />
                          </Tooltip>
                        </Popconfirm>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className={styles.editArea}>
                      <TextArea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        maxLength={2000}
                        showCount
                        autoSize={{ minRows: 2, maxRows: 6 }}
                        className={styles.editInput}
                      />
                      <div className={styles.editActions}>
                        <Button size="small" icon={<CloseOutlined />} onClick={cancelEdit}>
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          icon={<SaveOutlined />}
                          loading={editSaving}
                          onClick={() => saveEdit(comment.id)}
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.content}>{comment.content}</p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Add Comment Input */}
      {canComment ? (
        <div className={styles.inputArea}>
          <TextArea
            placeholder="Write a comment..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            maxLength={2000}
            showCount
            autoSize={{ minRows: 2, maxRows: 6 }}
            className={styles.textarea}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
          <div className={styles.submitRow}>
            <span className={styles.hint}>Ctrl+Enter to submit</span>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={handleSubmit}
              disabled={!newContent.trim()}
              className={styles.submitBtn}
            >
              Comment
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.viewerNote}>
          <span>👁️ You have read-only access — comments are view-only.</span>
        </div>
      )}
    </div>
  );
};

export default IssueComments;
