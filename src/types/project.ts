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
