export interface CheckSessionRes {
  session_time_remaining_seconds: number;
}

export interface Config {
  comment_max_len: number;
  server_name: string;
  sprint_duration_seconds: number;
  sprint_title_max_len: number;
  story_desc_max_len: number;
  story_title_max_len: number;
  tag_desc_max_len: number;
  tag_title_max_len: number;
  task_desc_max_len: number;
  task_title_max_len: number;
}

export interface Task {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  status: string;
  story_id: string;
  edited: string;
  bulk_task: boolean;
}

export interface TaskComment {
  id: string;
  task_id: string;
  created_at: string;
  updated_at: string;
  text: string;
  edited: string;
}

export interface Tag {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  is_parent: string;
  edited: string;
}

export interface TagAssignment {
  id: string;
  created_at: string;
  tag_id: string;
  story_id: string;
}

export interface Sprint {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  start_date: string;
  end_date: string;
  edited: string;
}

export interface Story {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  status: string;
  sprint_id: string;
  edited: string;
}
