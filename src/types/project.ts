export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  key: string;
  description?: string;
}

export type ProjectRole = 'PROJECT_ADMIN' | 'DEVELOPER' | 'VIEWER';

export interface ProjectMember {
  userId: string;
  email: string;
  fullName: string;
  role: ProjectRole;
}

