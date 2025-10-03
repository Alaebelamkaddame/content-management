export interface Project {
  id: string;
  name: string;
  description?: string;
  archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectRequest {
  id: string;
  name: string;
  description?: string;
  archived?: boolean;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  archived?: boolean;
}