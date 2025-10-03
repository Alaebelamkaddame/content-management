export interface ClientToken {
  id: string;
  project_id: string;
  token: string;
  created_at: Date;
}

export interface CreateClientTokenRequest {
  project_id: string;
}