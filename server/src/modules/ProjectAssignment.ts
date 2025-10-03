export interface ProjectAssignment {
  id: string;
  project_id: string;
  user_id: string;
  created_at: Date;
}

export interface CreateProjectAssignmentRequest {
  project_id: string;
  user_id: string;
}