export type ActivityActionType =
  | 'ISSUE_CREATED'
  | 'ISSUE_UPDATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'ASSIGNEE_CHANGED'
  | 'COMMENT_ADDED'
  | 'COMMENT_UPDATED'
  | 'COMMENT_DELETED'
  | 'ISSUE_DELETED'
  | 'ASSIGNED'
  | 'SPRINT_CHANGED';

export interface ActivityLog {
  id: string;
  issueId: string | null;
  actionType: ActivityActionType;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  createdAt: string;
  actor: {
    userId: string;
    email: string;
    fullName: string;
  };
}
