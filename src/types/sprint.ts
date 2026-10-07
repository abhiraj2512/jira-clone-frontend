export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed counts (returned by list endpoint)
  issueCount: number;
  completedIssueCount: number;
  completionPercentage: number;
}

export interface CreateSprintInput {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSprintInput {
  name?: string;
  goal?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CompleteSprintResponse {
  sprint: Sprint;
  movedToBacklogCount: number;
}

export const SPRINT_STATUS_CONFIG: Record<
  SprintStatus,
  { label: string; color: string; bg: string; borderColor: string }
> = {
  PLANNED: {
    label: 'Planned',
    color: '#344563',
    bg: '#ebecf0',
    borderColor: '#c1c7d0',
  },
  ACTIVE: {
    label: 'Active',
    color: '#006644',
    bg: '#e3fcef',
    borderColor: '#57d9a3',
  },
  COMPLETED: {
    label: 'Completed',
    color: '#0747a6',
    bg: '#deebff',
    borderColor: '#4c9aff',
  },
};
