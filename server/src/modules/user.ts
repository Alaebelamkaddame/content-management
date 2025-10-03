export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'team_leader' | 'team_member';
  full_name: string;
  avatar_url?: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: 'admin' | 'team_leader' | 'team_member';
  full_name: string;
  avatar_url?: string;
  email: string;
}

export interface UpdateUserRequest {
  username?: string;
  role?: 'admin' | 'team_leader' | 'team_member';
  full_name?: string;
  avatar_url?: string;
  email?: string;
}