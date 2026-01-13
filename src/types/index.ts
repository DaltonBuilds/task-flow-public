// Type definitions for Task Manager
import type { D1Database } from '@cloudflare/workers-types';

export interface Board {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  background_type: 'solid' | 'gradient';
  background_value: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  position: number;
  auto_archive: boolean;
  auto_archive_days: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
}

// Recurrence rule type - structured JSON format
export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number; // Every X days/weeks/months
  weekdays?: number[]; // For weekly: 0=Sun, 1=Mon, ..., 6=Sat
  monthDay?: number; // For monthly: day of month (1-31)
  monthWeek?: number; // For monthly relative: 1=first, 2=second, -1=last
  monthWeekday?: number; // For monthly relative: day of week
}

export interface Task {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  tags: string[];
  position: number;
  recurrence_rule: RecurrenceRule | null;
  recurrence_end_date: string | null;
  recurrence_count: number | null;
  recurrence_completed_count: number;
  original_task_id: string | null;
  is_recurrence_instance: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Board with nested data
export interface BoardWithDetails extends Board {
  columns: ColumnWithTasks[];
}

export interface ColumnWithTasks extends Column {
  tasks: TaskWithSubtasks[];
}

export interface TaskWithSubtasks extends Task {
  subtasks: Subtask[];
  comments: Comment[];
  comment_count?: number;
}

// Board template types
export type BoardTemplate = 'blank' | 'simple' | 'basic' | 'extended';

// Create/Update DTOs
export interface CreateBoardDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  background_type?: 'solid' | 'gradient';
  background_value?: string;
  template?: BoardTemplate;
}

export interface UpdateBoardDto {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  background_type?: 'solid' | 'gradient';
  background_value?: string;
  archived_at?: string | null;
}

export interface CreateColumnDto {
  name: string;
  position?: number;
}

export interface UpdateColumnDto {
  name?: string;
  position?: number;
  auto_archive?: boolean;
  auto_archive_days?: number;
  archived_at?: string | null;
}

export interface CreateTaskDto {
  column_id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  tags?: string[];
  position?: number;
  recurrence_rule?: RecurrenceRule | null;
  recurrence_end_date?: string | null;
  recurrence_count?: number | null;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  column_id?: string;
  position?: number;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  tags?: string[];
  archived_at?: string | null;
  recurrence_rule?: RecurrenceRule | null;
  recurrence_end_date?: string | null;
  recurrence_count?: number | null;
  recurrence_completed_count?: number;
}

export interface CreateSubtaskDto {
  title: string;
  position?: number;
}

export interface UpdateSubtaskDto {
  title?: string;
  is_completed?: boolean;
  position?: number;
}

export interface CreateCommentDto {
  content: string;
}

export interface UpdateCommentDto {
  content?: string;
}

// Activity Log types
export type ActivityEntityType = 'task' | 'board' | 'column' | 'subtask';
export type ActivityAction = 
  | 'created' 
  | 'moved' 
  | 'edited' 
  | 'completed' 
  | 'deleted' 
  | 'archived' 
  | 'restored'
  | 'priority_changed'
  | 'due_date_set'
  | 'due_date_removed'
  | 'tag_added'
  | 'tag_removed'
  | 'subtask_completed'
  | 'subtask_created'
  | 'subtask_deleted'
  | 'comment_added'
  | 'comment_edited'
  | 'comment_deleted';

export interface ActivityLog {
  id: string;
  entity_type: ActivityEntityType;
  entity_id: string;
  action: ActivityAction;
  details: Record<string, unknown>; // JSON object with change details
  created_at: string;
}

// Analytics types
export interface TasksByStatus {
  column_id: string;
  column_name: string;
  count: number;
  percentage: number;
}

export interface TasksByPriority {
  priority: 'low' | 'medium' | 'high';
  count: number;
  percentage: number;
}

export interface CompletionTrend {
  date: string;
  completed: number;
  created: number;
}

export interface VelocityData {
  week_start: string;
  week_end: string;
  completed: number;
  created: number;
}

export interface ProjectBreakdown {
  board_id: string;
  board_name: string;
  board_icon: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

export interface AnalyticsSummary {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  due_today: number;
  due_this_week: number;
  completed_this_week: number;
  completed_this_month: number;
  tasks_by_status: TasksByStatus[];
  tasks_by_priority: TasksByPriority[];
  completion_trend: CompletionTrend[];
  velocity: VelocityData[];
  project_breakdown: ProjectBreakdown[];
}

// Cloudflare bindings
export interface Bindings {
  DB: D1Database;
  ALLOWED_ORIGINS?: string; // Comma-separated list of allowed origins for CORS
  ENVIRONMENT?: string; // 'development' | 'production'
}

// Variables stored in Hono context
export interface Variables {
  requestId: string;
  logger: import('../utils/logger').Logger;
  userEmail?: string;
  userIdentity?: string;
  accessJwt?: string;
}
