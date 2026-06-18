export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type IssueType = 'TASK' | 'BUG' | 'STORY' | 'EPIC';

/** Lightweight shape returned by GET /projects/:id/issues */
export interface IssueSummary {
  id: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string | null;
  createdAt: string;
}

/** Full shape returned by GET /issues/:id */
export interface Issue extends IssueSummary {
  description: string | null;
  reporterId: string;
  projectId: string;
  issueKey: string | null;
  updatedAt: string;
}

/** Payload for POST /projects/:id/issues */
export interface CreateIssueInput {
  title: string;
  description?: string;
  priority?: IssuePriority;
  assigneeId?: string;
}

/** Payload for PATCH /issues/:id */
export interface UpdateIssueInput {
  title?: string;
  description?: string;
  priority?: IssuePriority;
  assigneeId?: string | null;
}

/** Payload for PATCH /issues/:id/status */
export interface UpdateIssueStatusInput {
  status: IssueStatus;
}

// ── Status & Priority config maps ────────────────────────────────────────────

export const STATUS_LABELS: Record<IssueStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export const PRIORITY_CONFIG: Record<
  IssuePriority,
  { label: string; color: string; bg: string }
> = {
  HIGH:   { label: 'High',   color: '#de350b', bg: '#ffebe6' },
  MEDIUM: { label: 'Medium', color: '#ff991f', bg: '#fff4e5' },
  LOW:    { label: 'Low',    color: '#36b37e', bg: '#e3fcef' },
};

/** Allowed status transitions (mirrored from backend) */
export const ALLOWED_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  TODO:        ['IN_PROGRESS'],
  IN_PROGRESS: ['DONE', 'TODO'],
  DONE:        ['IN_PROGRESS'],
};
