export interface ContentItem {
  id: string;
  project_id: string;
  title: string;
  caption: string;
  type: 'post' | 'reel' | 'story';
  platforms: string[];
  status: 'idea' | 'draft' | 'ready' | 'scheduled' | 'published';
  assignee_id?: string;
  start_date: Date;
  end_date?: Date;
  assets: any[];
  notes_internal: string;
  notes_client: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateContentItemRequest {
  project_id: string;
  title?: string;
  caption?: string;
  type: 'post' | 'reel' | 'story';
  platforms?: string[];
  status?: 'idea' | 'draft' | 'ready' | 'scheduled' | 'published';
  assignee_id?: string;
  start_date: Date;
  end_date?: Date;
  assets?: any[];
  notes_internal?: string;
  notes_client?: string;
}

export interface UpdateContentItemRequest {
  title?: string;
  caption?: string;
  type?: 'post' | 'reel' | 'story';
  platforms?: string[];
  status?: 'idea' | 'draft' | 'ready' | 'scheduled' | 'published';
  assignee_id?: string;
  start_date?: Date;
  end_date?: Date;
  assets?: any[];
  notes_internal?: string;
  notes_client?: string;
}