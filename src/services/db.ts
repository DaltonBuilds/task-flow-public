// Database service layer for Task Manager
import type { D1Database } from '@cloudflare/workers-types';
import type { 
  Board, Column, Task, Subtask, Comment,
  BoardWithDetails, ColumnWithTasks, TaskWithSubtasks,
  CreateBoardDto, UpdateBoardDto,
  CreateColumnDto, UpdateColumnDto,
  CreateTaskDto, UpdateTaskDto,
  CreateSubtaskDto, UpdateSubtaskDto,
  CreateCommentDto, UpdateCommentDto,
  RecurrenceRule,
  ActivityLog, ActivityEntityType, ActivityAction
} from '../types';

// Generate UUID v4
export function generateId(prefix: string = ''): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

// Get current ISO timestamp
export function now(): string {
  return new Date().toISOString();
}

// Cache for database initialization state (per worker instance)
let dbInitialized = false;
let dbInitializationPromise: Promise<void> | null = null;

// Initialize database schema
export async function initializeDatabase(db: D1Database): Promise<void> {
  // Return immediately if already initialized
  if (dbInitialized) {
    return;
  }
  
  // If initialization is in progress, wait for it
  if (dbInitializationPromise) {
    return dbInitializationPromise;
  }
  
  // Start initialization
  dbInitializationPromise = (async () => {
    try {
      // Check if tables exist by querying one of them
      try {
        await db.prepare('SELECT 1 FROM boards LIMIT 1').first();
        // Table exists, mark as initialized
        dbInitialized = true;
        return;
      } catch {
        // Table doesn't exist, proceed with creation
      }
      
      // Create tables if they don't exist
      await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT DEFAULT '📋',
        color TEXT DEFAULT '#10B981',
        background_type TEXT DEFAULT 'solid',
        background_value TEXT DEFAULT '#f3f4f6',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        deleted_at TEXT
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS columns (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        name TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        auto_archive INTEGER NOT NULL DEFAULT 0,
        auto_archive_days INTEGER NOT NULL DEFAULT 7,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        deleted_at TEXT,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        column_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        due_date TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        position INTEGER NOT NULL DEFAULT 0,
        recurrence_rule TEXT,
        recurrence_end_date TEXT,
        recurrence_count INTEGER,
        recurrence_completed_count INTEGER DEFAULT 0,
        original_task_id TEXT,
        is_recurrence_instance INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        deleted_at TEXT,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS subtasks (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action)
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(task_id, created_at DESC)
    `)
      ]);
      
      // Mark as initialized
      dbInitialized = true;
    } catch (error) {
      // Reset promise on error so it can be retried
      dbInitializationPromise = null;
      throw error;
    }
  })();
  
  return dbInitializationPromise;
}

// ===================
// Board Operations
// ===================

export async function getBoards(
  db: D1Database, 
  options: { includeArchived?: boolean; includeDeleted?: boolean } = {}
): Promise<Board[]> {
  let query = 'SELECT * FROM boards WHERE 1=1';
  
  if (!options.includeDeleted) {
    query += ' AND deleted_at IS NULL';
  }
  if (!options.includeArchived) {
    query += ' AND archived_at IS NULL';
  }
  
  query += ' ORDER BY created_at DESC';
  
  const result = await db.prepare(query).all<Board>();
  return result.results || [];
}

export async function getBoardById(db: D1Database, id: string): Promise<Board | null> {
  const result = await db.prepare('SELECT * FROM boards WHERE id = ?').bind(id).first<Board>();
  return result || null;
}

export async function getBoardWithDetails(db: D1Database, id: string): Promise<BoardWithDetails | null> {
  const board = await getBoardById(db, id);
  if (!board) return null;
  
  // Get columns for this board
  const columnsResult = await db.prepare(`
    SELECT * FROM columns 
    WHERE board_id = ? AND deleted_at IS NULL 
    ORDER BY position ASC
  `).bind(id).all<Column>();
  
  const columns = columnsResult.results || [];
  
  // Get all tasks for this board
  const tasksResult = await db.prepare(`
    SELECT * FROM tasks 
    WHERE board_id = ? AND deleted_at IS NULL AND archived_at IS NULL
    ORDER BY position ASC
  `).bind(id).all<Task>();
  
  const tasks = (tasksResult.results || []).map((t: Task) => ({
    ...t,
    tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags,
    recurrence_rule: t.recurrence_rule ? (typeof t.recurrence_rule === 'string' ? JSON.parse(t.recurrence_rule) : t.recurrence_rule) : null,
    is_recurrence_instance: Boolean(t.is_recurrence_instance)
  }));
  
  // Get all subtasks for these tasks
  const taskIds = tasks.map((t: Task) => t.id);
  let subtasks: Subtask[] = [];
  let commentCounts: Record<string, number> = {};
  
  if (taskIds.length > 0) {
    const placeholders = taskIds.map(() => '?').join(',');
    const subtasksResult = await db.prepare(`
      SELECT * FROM subtasks 
      WHERE task_id IN (${placeholders})
      ORDER BY position ASC
    `).bind(...taskIds).all<Subtask>();
    
    subtasks = (subtasksResult.results || []).map((s: Subtask) => ({
      ...s,
      is_completed: Boolean(s.is_completed)
    }));
    
    // Get comment counts for each task
    const commentCountsResult = await db.prepare(`
      SELECT task_id, COUNT(*) as count FROM comments WHERE task_id IN (${placeholders}) GROUP BY task_id
    `).bind(...taskIds).all<{ task_id: string; count: number }>();
    
    (commentCountsResult.results || []).forEach((cc: { task_id: string; count: number }) => {
      commentCounts[cc.task_id] = cc.count;
    });
  }
  
  // Build nested structure
  const columnsWithTasks: ColumnWithTasks[] = columns.map((col: Column) => ({
    ...col,
    tasks: tasks
      .filter((t: Task) => t.column_id === col.id)
      .map((t: Task) => ({
        ...t,
        subtasks: subtasks.filter((s: Subtask) => s.task_id === t.id),
        comments: [], // Comments are loaded on-demand when opening task modal
        comment_count: commentCounts[t.id] || 0
      }))
  }));
  
  return {
    ...board,
    columns: columnsWithTasks
  };
}

// Board templates with their column configurations
const BOARD_TEMPLATES: Record<string, string[]> = {
  'blank': [],
  'simple': ['Not Started', 'Completed'],
  'basic': ['To Do', 'In Progress', 'Done'],
  'extended': ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']
};

export async function createBoard(db: D1Database, data: CreateBoardDto): Promise<BoardWithDetails> {
  const id = generateId('board');
  const timestamp = now();
  
  await db.prepare(`
    INSERT INTO boards (id, name, description, icon, color, background_type, background_value, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, 
    data.name, 
    data.description || null, 
    data.icon || '📋',
    data.color || '#10B981',
    data.background_type || 'solid',
    data.background_value || '#f3f4f6',
    timestamp, 
    timestamp
  ).run();
  
  // Create columns based on template (default to 'basic' if not specified)
  const template = data.template || 'basic';
  const columns = BOARD_TEMPLATES[template] || BOARD_TEMPLATES['basic'];
  
  for (let i = 0; i < columns.length; i++) {
    const colId = generateId('col');
    await db.prepare(`
      INSERT INTO columns (id, board_id, name, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(colId, id, columns[i], i, timestamp, timestamp).run();
  }
  
  return getBoardWithDetails(db, id) as Promise<BoardWithDetails>;
}

export async function updateBoard(db: D1Database, id: string, data: UpdateBoardDto): Promise<Board | null> {
  const board = await getBoardById(db, id);
  if (!board) return null;
  
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.icon !== undefined) {
    updates.push('icon = ?');
    values.push(data.icon);
  }
  if (data.color !== undefined) {
    updates.push('color = ?');
    values.push(data.color);
  }
  if (data.background_type !== undefined) {
    updates.push('background_type = ?');
    values.push(data.background_type);
  }
  if (data.background_value !== undefined) {
    updates.push('background_value = ?');
    values.push(data.background_value);
  }
  if (data.archived_at !== undefined) {
    updates.push('archived_at = ?');
    values.push(data.archived_at);
  }
  
  if (updates.length === 0) return board;
  
  updates.push('updated_at = ?');
  values.push(now());
  values.push(id);
  
  await db.prepare(`
    UPDATE boards SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();
  
  return getBoardById(db, id);
}

export async function deleteBoard(db: D1Database, id: string, hard: boolean = false): Promise<boolean> {
  if (hard) {
    const result = await db.prepare('DELETE FROM boards WHERE id = ?').bind(id).run();
    return result.meta.changes > 0;
  }
  
  const result = await db.prepare(`
    UPDATE boards SET deleted_at = ?, updated_at = ? WHERE id = ?
  `).bind(now(), now(), id).run();
  
  return result.meta.changes > 0;
}

// ===================
// Column Operations
// ===================

export async function getColumns(
  db: D1Database, 
  boardId: string,
  options: { includeDeleted?: boolean } = {}
): Promise<Column[]> {
  let query = 'SELECT * FROM columns WHERE board_id = ?';
  
  if (!options.includeDeleted) {
    query += ' AND deleted_at IS NULL';
  }
  
  query += ' ORDER BY position ASC';
  
  const result = await db.prepare(query).bind(boardId).all<Column>();
  return result.results || [];
}

export async function getColumnById(db: D1Database, id: string): Promise<Column | null> {
  const result = await db.prepare('SELECT * FROM columns WHERE id = ?').bind(id).first<Column>();
  return result || null;
}

export async function createColumn(db: D1Database, boardId: string, data: CreateColumnDto): Promise<Column> {
  const id = generateId('col');
  const timestamp = now();
  
  // Get max position if not specified
  let position = data.position;
  if (position === undefined) {
    const maxResult = await db.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM columns WHERE board_id = ?
    `).bind(boardId).first<{ next_pos: number }>();
    position = maxResult?.next_pos || 0;
  }
  
  await db.prepare(`
    INSERT INTO columns (id, board_id, name, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, boardId, data.name, position, timestamp, timestamp).run();
  
  return getColumnById(db, id) as Promise<Column>;
}

export async function updateColumn(db: D1Database, id: string, data: UpdateColumnDto): Promise<Column | null> {
  const column = await getColumnById(db, id);
  if (!column) return null;
  
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.position !== undefined) {
    updates.push('position = ?');
    values.push(data.position);
  }
  if (data.auto_archive !== undefined) {
    updates.push('auto_archive = ?');
    values.push(data.auto_archive ? 1 : 0);
  }
  if (data.auto_archive_days !== undefined) {
    updates.push('auto_archive_days = ?');
    values.push(data.auto_archive_days);
  }
  if (data.archived_at !== undefined) {
    updates.push('archived_at = ?');
    values.push(data.archived_at);
  }
  
  if (updates.length === 0) return column;
  
  updates.push('updated_at = ?');
  values.push(now());
  values.push(id);
  
  await db.prepare(`
    UPDATE columns SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();
  
  return getColumnById(db, id);
}

export async function deleteColumn(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE columns SET deleted_at = ?, updated_at = ? WHERE id = ?
  `).bind(now(), now(), id).run();
  
  return result.meta.changes > 0;
}

// ===================
// Task Operations
// ===================

export async function getTasks(
  db: D1Database,
  boardId: string,
  options: {
    columnId?: string;
    priority?: string;
    tag?: string;
    includeArchived?: boolean;
    includeDeleted?: boolean;
    sort?: string;
    order?: 'asc' | 'desc';
  } = {}
): Promise<TaskWithSubtasks[]> {
  let query = 'SELECT * FROM tasks WHERE board_id = ?';
  const params: unknown[] = [boardId];
  
  if (!options.includeDeleted) {
    query += ' AND deleted_at IS NULL';
  }
  if (!options.includeArchived) {
    query += ' AND archived_at IS NULL';
  }
  if (options.columnId) {
    query += ' AND column_id = ?';
    params.push(options.columnId);
  }
  if (options.priority) {
    query += ' AND priority = ?';
    params.push(options.priority);
  }
  
  // Validate and sanitize sort field and order to prevent SQL injection
  const ALLOWED_SORT_FIELDS = ['position', 'due_date', 'priority', 'updated_at', 'created_at', 'title'];
  const ALLOWED_ORDERS = ['asc', 'desc'];
  
  const sortField = (options.sort && ALLOWED_SORT_FIELDS.includes(options.sort))
    ? options.sort
    : 'position';
  const sortOrder = (options.order && ALLOWED_ORDERS.includes(options.order.toLowerCase()))
    ? options.order.toLowerCase()
    : 'asc';
  
  query += ` ORDER BY ${sortField} ${sortOrder}`;
  
  const result = await db.prepare(query).bind(...params).all<Task>();
  const tasks = (result.results || []).map((t: Task) => ({
    ...t,
    tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags,
    recurrence_rule: t.recurrence_rule ? (typeof t.recurrence_rule === 'string' ? JSON.parse(t.recurrence_rule) : t.recurrence_rule) : null,
    is_recurrence_instance: Boolean(t.is_recurrence_instance)
  }));
  
  // Filter by tag if specified
  let filteredTasks = tasks;
  if (options.tag) {
    filteredTasks = tasks.filter((t: Task) => t.tags.includes(options.tag!));
  }
  
  // Get subtasks and comment counts
  const taskIds = filteredTasks.map((t: Task) => t.id);
  let subtasks: Subtask[] = [];
  let commentCounts: Record<string, number> = {};
  
  if (taskIds.length > 0) {
    const placeholders = taskIds.map(() => '?').join(',');
    const subtasksResult = await db.prepare(`
      SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY position ASC
    `).bind(...taskIds).all<Subtask>();
    
    subtasks = (subtasksResult.results || []).map((s: Subtask) => ({
      ...s,
      is_completed: Boolean(s.is_completed)
    }));
    
    // Get comment counts for each task
    const commentCountsResult = await db.prepare(`
      SELECT task_id, COUNT(*) as count FROM comments WHERE task_id IN (${placeholders}) GROUP BY task_id
    `).bind(...taskIds).all<{ task_id: string; count: number }>();
    
    (commentCountsResult.results || []).forEach((cc: { task_id: string; count: number }) => {
      commentCounts[cc.task_id] = cc.count;
    });
  }
  
  return filteredTasks.map((t: Task) => ({
    ...t,
    subtasks: subtasks.filter((s: Subtask) => s.task_id === t.id),
    comments: [], // Comments are loaded on-demand when opening task modal
    comment_count: commentCounts[t.id] || 0
  }));
}

export async function getTaskById(db: D1Database, id: string): Promise<TaskWithSubtasks | null> {
  const result = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first<Task>();
  if (!result) return null;
  
  const task = {
    ...result,
    tags: typeof result.tags === 'string' ? JSON.parse(result.tags) : result.tags,
    recurrence_rule: result.recurrence_rule ? (typeof result.recurrence_rule === 'string' ? JSON.parse(result.recurrence_rule) : result.recurrence_rule) : null,
    is_recurrence_instance: Boolean(result.is_recurrence_instance)
  };
  
  const subtasksResult = await db.prepare(`
    SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC
  `).bind(id).all<Subtask>();
  
  const subtasks = (subtasksResult.results || []).map((s: Subtask) => ({
    ...s,
    is_completed: Boolean(s.is_completed)
  }));
  
  // Get comments for this task
  const commentsResult = await db.prepare(`
    SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC
  `).bind(id).all<Comment>();
  
  const comments = commentsResult.results || [];
  
  return { ...task, subtasks, comments };
}

export async function createTask(db: D1Database, boardId: string, data: CreateTaskDto): Promise<TaskWithSubtasks> {
  const id = generateId('task');
  const timestamp = now();
  
  // Get max position if not specified
  let position = data.position;
  if (position === undefined) {
    const maxResult = await db.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks WHERE column_id = ?
    `).bind(data.column_id).first<{ next_pos: number }>();
    position = maxResult?.next_pos || 0;
  }
  
  // Get column name for activity log
  const column = await getColumnById(db, data.column_id);
  const columnName = column?.name || 'Unknown';
  
  const tags = JSON.stringify(data.tags || []);
  const recurrenceRule = data.recurrence_rule ? JSON.stringify(data.recurrence_rule) : null;
  
  await db.prepare(`
    INSERT INTO tasks (id, board_id, column_id, title, description, priority, due_date, tags, position, recurrence_rule, recurrence_end_date, recurrence_count, recurrence_completed_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).bind(
    id, boardId, data.column_id, data.title, data.description || null,
    data.priority || 'medium', data.due_date || null, tags, position,
    recurrenceRule, data.recurrence_end_date || null, data.recurrence_count ?? null,
    timestamp, timestamp
  ).run();
  
  // Log activity
  await logActivity(db, 'task', id, 'created', {
    title: data.title,
    column_name: columnName
  });
  
  return getTaskById(db, id) as Promise<TaskWithSubtasks>;
}

export async function updateTask(db: D1Database, id: string, data: UpdateTaskDto): Promise<TaskWithSubtasks | null> {
  const task = await getTaskById(db, id);
  if (!task) return null;
  
  const updates: string[] = [];
  const values: unknown[] = [];
  const activities: Array<{ action: ActivityAction; details: Record<string, unknown> }> = [];
  
  if (data.title !== undefined && data.title !== task.title) {
    updates.push('title = ?');
    values.push(data.title);
    activities.push({
      action: 'edited',
      details: { field: 'title', old_value: task.title, new_value: data.title }
    });
  }
  if (data.description !== undefined && data.description !== task.description) {
    updates.push('description = ?');
    values.push(data.description);
    activities.push({
      action: 'edited',
      details: { field: 'description' }
    });
  }
  if (data.column_id !== undefined && data.column_id !== task.column_id) {
    updates.push('column_id = ?');
    values.push(data.column_id);
    // Get column names for activity log
    const oldColumn = await getColumnById(db, task.column_id);
    const newColumn = await getColumnById(db, data.column_id);
    activities.push({
      action: 'moved',
      details: {
        from_column: oldColumn?.name || 'Unknown',
        to_column: newColumn?.name || 'Unknown'
      }
    });
  }
  if (data.position !== undefined) {
    updates.push('position = ?');
    values.push(data.position);
  }
  if (data.priority !== undefined && data.priority !== task.priority) {
    updates.push('priority = ?');
    values.push(data.priority);
    activities.push({
      action: 'priority_changed',
      details: { old_priority: task.priority, new_priority: data.priority }
    });
  }
  if (data.due_date !== undefined) {
    updates.push('due_date = ?');
    values.push(data.due_date);
    if (data.due_date === null && task.due_date) {
      activities.push({
        action: 'due_date_removed',
        details: {}
      });
    } else if (data.due_date && data.due_date !== task.due_date) {
      activities.push({
        action: 'due_date_set',
        details: { due_date: data.due_date }
      });
    }
  }
  if (data.tags !== undefined) {
    updates.push('tags = ?');
    values.push(JSON.stringify(data.tags));
    const oldTags = task.tags || [];
    const newTags = data.tags || [];
    const addedTags = newTags.filter((t: string) => !oldTags.includes(t));
    const removedTags = oldTags.filter((t: string) => !newTags.includes(t));
    if (addedTags.length > 0) {
      activities.push({
        action: 'tag_added',
        details: { tags: addedTags }
      });
    }
    if (removedTags.length > 0) {
      activities.push({
        action: 'tag_removed',
        details: { tags: removedTags }
      });
    }
  }
  if (data.archived_at !== undefined) {
    updates.push('archived_at = ?');
    values.push(data.archived_at);
    if (data.archived_at && !task.archived_at) {
      activities.push({
        action: 'archived',
        details: {}
      });
    } else if (!data.archived_at && task.archived_at) {
      activities.push({
        action: 'restored',
        details: {}
      });
    }
  }
  if (data.recurrence_rule !== undefined) {
    updates.push('recurrence_rule = ?');
    values.push(data.recurrence_rule ? JSON.stringify(data.recurrence_rule) : null);
  }
  if (data.recurrence_end_date !== undefined) {
    updates.push('recurrence_end_date = ?');
    values.push(data.recurrence_end_date);
  }
  if (data.recurrence_count !== undefined) {
    updates.push('recurrence_count = ?');
    values.push(data.recurrence_count);
  }
  if (data.recurrence_completed_count !== undefined) {
    updates.push('recurrence_completed_count = ?');
    values.push(data.recurrence_completed_count);
  }
  
  if (updates.length === 0) return task;
  
  updates.push('updated_at = ?');
  values.push(now());
  values.push(id);
  
  await db.prepare(`
    UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();
  
  // Log all activities
  for (const activity of activities) {
    await logActivity(db, 'task', id, activity.action, activity.details);
  }
  
  return getTaskById(db, id);
}

export async function deleteTask(db: D1Database, id: string): Promise<boolean> {
  const task = await getTaskById(db, id);
  if (!task) return false;
  
  const result = await db.prepare(`
    UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?
  `).bind(now(), now(), id).run();
  
  if (result.meta.changes > 0) {
    // Log activity
    await logActivity(db, 'task', id, 'deleted', {
      title: task.title
    });
  }
  
  return result.meta.changes > 0;
}

// ===================
// Subtask Operations
// ===================

export async function getSubtasks(db: D1Database, taskId: string): Promise<Subtask[]> {
  const result = await db.prepare(`
    SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC
  `).bind(taskId).all<Subtask>();
  
  return (result.results || []).map(s => ({
    ...s,
    is_completed: Boolean(s.is_completed)
  }));
}

export async function getSubtaskById(db: D1Database, id: string): Promise<Subtask | null> {
  const result = await db.prepare('SELECT * FROM subtasks WHERE id = ?').bind(id).first<Subtask>();
  if (!result) return null;
  
  return { ...result, is_completed: Boolean(result.is_completed) };
}

export async function createSubtask(db: D1Database, taskId: string, data: CreateSubtaskDto): Promise<Subtask> {
  const id = generateId('sub');
  const timestamp = now();
  
  // Get max position if not specified
  let position = data.position;
  if (position === undefined) {
    const maxResult = await db.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM subtasks WHERE task_id = ?
    `).bind(taskId).first<{ next_pos: number }>();
    position = maxResult?.next_pos || 0;
  }
  
  await db.prepare(`
    INSERT INTO subtasks (id, task_id, title, is_completed, position, created_at, updated_at)
    VALUES (?, ?, ?, 0, ?, ?, ?)
  `).bind(id, taskId, data.title, position, timestamp, timestamp).run();
  
  // Log activity
  await logActivity(db, 'subtask', id, 'subtask_created', {
    task_id: taskId,
    title: data.title
  });
  
  return getSubtaskById(db, id) as Promise<Subtask>;
}

export async function updateSubtask(db: D1Database, id: string, data: UpdateSubtaskDto): Promise<Subtask | null> {
  const subtask = await getSubtaskById(db, id);
  if (!subtask) return null;
  
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (data.title !== undefined && data.title !== subtask.title) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.is_completed !== undefined && data.is_completed !== subtask.is_completed) {
    updates.push('is_completed = ?');
    values.push(data.is_completed ? 1 : 0);
    // Log subtask completion
    await logActivity(db, 'subtask', id, 'subtask_completed', {
      task_id: subtask.task_id,
      title: subtask.title,
      completed: data.is_completed
    });
  }
  if (data.position !== undefined) {
    updates.push('position = ?');
    values.push(data.position);
  }
  
  if (updates.length === 0) return subtask;
  
  updates.push('updated_at = ?');
  values.push(now());
  values.push(id);
  
  await db.prepare(`
    UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();
  
  return getSubtaskById(db, id);
}

export async function deleteSubtask(db: D1Database, id: string): Promise<boolean> {
  const subtask = await getSubtaskById(db, id);
  if (!subtask) return false;
  
  const result = await db.prepare('DELETE FROM subtasks WHERE id = ?').bind(id).run();
  
  if (result.meta.changes > 0) {
    // Log activity
    await logActivity(db, 'subtask', id, 'subtask_deleted', {
      task_id: subtask.task_id,
      title: subtask.title
    });
  }
  
  return result.meta.changes > 0;
}

// ===================
// Comment Operations
// ===================

export async function getComments(db: D1Database, taskId: string): Promise<Comment[]> {
  const result = await db.prepare(`
    SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC
  `).bind(taskId).all<Comment>();
  
  return result.results || [];
}

export async function getCommentById(db: D1Database, id: string): Promise<Comment | null> {
  const result = await db.prepare('SELECT * FROM comments WHERE id = ?').bind(id).first<Comment>();
  return result || null;
}

export async function createComment(db: D1Database, taskId: string, data: CreateCommentDto): Promise<Comment> {
  const id = generateId('comment');
  const timestamp = now();
  
  await db.prepare(`
    INSERT INTO comments (id, task_id, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, taskId, data.content, timestamp, timestamp).run();
  
  // Log activity
  await logActivity(db, 'task', taskId, 'comment_added', {
    comment_id: id,
    content_preview: data.content.substring(0, 100)
  });
  
  return getCommentById(db, id) as Promise<Comment>;
}

export async function updateComment(db: D1Database, id: string, data: UpdateCommentDto): Promise<Comment | null> {
  const comment = await getCommentById(db, id);
  if (!comment) return null;
  
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (data.content !== undefined && data.content !== comment.content) {
    updates.push('content = ?');
    values.push(data.content);
  }
  
  if (updates.length === 0) return comment;
  
  updates.push('updated_at = ?');
  values.push(now());
  values.push(id);
  
  await db.prepare(`
    UPDATE comments SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();
  
  // Log activity
  await logActivity(db, 'task', comment.task_id, 'comment_edited', {
    comment_id: id
  });
  
  return getCommentById(db, id);
}

export async function deleteComment(db: D1Database, id: string): Promise<boolean> {
  const comment = await getCommentById(db, id);
  if (!comment) return false;
  
  const result = await db.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
  
  if (result.meta.changes > 0) {
    // Log activity
    await logActivity(db, 'task', comment.task_id, 'comment_deleted', {
      comment_id: id
    });
  }
  
  return result.meta.changes > 0;
}

export async function getCommentCount(db: D1Database, taskId: string): Promise<number> {
  const result = await db.prepare(`
    SELECT COUNT(*) as count FROM comments WHERE task_id = ?
  `).bind(taskId).first<{ count: number }>();
  
  return result?.count || 0;
}

// ===================
// Recurrence Operations
// ===================

// Calculate the next occurrence date based on recurrence rule
export function calculateNextOccurrence(currentDate: string, rule: RecurrenceRule): string {
  const date = new Date(currentDate);
  
  switch (rule.type) {
    case 'daily':
      date.setDate(date.getDate() + rule.interval);
      break;
      
    case 'weekly':
      if (rule.weekdays && rule.weekdays.length > 0) {
        // Find the next weekday in the list
        const currentDay = date.getDay();
        const sortedDays = [...rule.weekdays].sort((a, b) => a - b);
        
        // Find next day in same week or next occurrence
        let foundNext = false;
        for (const day of sortedDays) {
          if (day > currentDay) {
            date.setDate(date.getDate() + (day - currentDay));
            foundNext = true;
            break;
          }
        }
        
        if (!foundNext) {
          // Go to next week's first day in the list
          const daysUntilNextWeek = 7 - currentDay + sortedDays[0];
          date.setDate(date.getDate() + daysUntilNextWeek + (rule.interval - 1) * 7);
        }
      } else {
        date.setDate(date.getDate() + 7 * rule.interval);
      }
      break;
      
    case 'monthly':
      if (rule.monthDay) {
        // Specific day of month
        date.setMonth(date.getMonth() + rule.interval);
        const maxDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(rule.monthDay, maxDay));
      } else if (rule.monthWeek !== undefined && rule.monthWeekday !== undefined) {
        // Relative (e.g., "2nd Monday")
        date.setMonth(date.getMonth() + rule.interval);
        date.setDate(1);
        
        // Find the nth weekday
        const targetWeekday = rule.monthWeekday;
        const week = rule.monthWeek;
        
        if (week > 0) {
          // Positive week number (1st, 2nd, 3rd, 4th)
          let count = 0;
          while (count < week) {
            if (date.getDay() === targetWeekday) {
              count++;
              if (count === week) break;
            }
            date.setDate(date.getDate() + 1);
          }
        } else {
          // Last occurrence (-1)
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          date.setDate(lastDay);
          while (date.getDay() !== targetWeekday) {
            date.setDate(date.getDate() - 1);
          }
        }
      } else {
        // Default: same day next month
        const currentDay = date.getDate();
        date.setMonth(date.getMonth() + rule.interval);
        const maxDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(currentDay, maxDay));
      }
      break;
      
    case 'custom':
      // Custom interval in days
      date.setDate(date.getDate() + rule.interval);
      break;
  }
  
  return date.toISOString().split('T')[0];
}

// Create the next occurrence of a recurring task
export async function createNextRecurrence(db: D1Database, task: TaskWithSubtasks): Promise<TaskWithSubtasks | null> {
  if (!task.recurrence_rule) return null;
  
  // Check if we've reached the recurrence limit
  const completedCount = (task.recurrence_completed_count || 0) + 1;
  if (task.recurrence_count && completedCount >= task.recurrence_count) {
    return null; // No more recurrences
  }
  
  // Check if we're past the end date
  const nextDueDate = task.due_date 
    ? calculateNextOccurrence(task.due_date, task.recurrence_rule)
    : calculateNextOccurrence(now().split('T')[0], task.recurrence_rule);
    
  if (task.recurrence_end_date && nextDueDate > task.recurrence_end_date) {
    return null; // Past end date
  }
  
  // Update the completed count on the original task
  await updateTask(db, task.original_task_id || task.id, {
    recurrence_completed_count: completedCount
  });
  
  // Create the new task
  const id = generateId('task');
  const timestamp = now();
  
  // Get max position
  const maxResult = await db.prepare(`
    SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks WHERE column_id = ?
  `).bind(task.column_id).first<{ next_pos: number }>();
  const position = maxResult?.next_pos || 0;
  
  const tags = JSON.stringify(task.tags || []);
  const recurrenceRule = JSON.stringify(task.recurrence_rule);
  const originalTaskId = task.original_task_id || task.id;
  
  await db.prepare(`
    INSERT INTO tasks (id, board_id, column_id, title, description, priority, due_date, tags, position, recurrence_rule, recurrence_end_date, recurrence_count, recurrence_completed_count, original_task_id, is_recurrence_instance, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(
    id, task.board_id, task.column_id, task.title, task.description,
    task.priority, nextDueDate, tags, position,
    recurrenceRule, task.recurrence_end_date, task.recurrence_count, completedCount,
    originalTaskId,
    timestamp, timestamp
  ).run();
  
  // Copy subtasks from the original task (uncompleted)
  if (task.subtasks && task.subtasks.length > 0) {
    for (let i = 0; i < task.subtasks.length; i++) {
      const subtask = task.subtasks[i];
      const subId = generateId('sub');
      await db.prepare(`
        INSERT INTO subtasks (id, task_id, title, is_completed, position, created_at, updated_at)
        VALUES (?, ?, ?, 0, ?, ?, ?)
      `).bind(subId, id, subtask.title, i, timestamp, timestamp).run();
    }
  }
  
  return getTaskById(db, id);
}

// Get the recurrence summary text for display
export function getRecurrenceSummary(rule: RecurrenceRule): string {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  switch (rule.type) {
    case 'daily':
      return rule.interval === 1 ? 'Daily' : `Every ${rule.interval} days`;
      
    case 'weekly':
      if (rule.weekdays && rule.weekdays.length > 0) {
        if (rule.weekdays.length === 7) return 'Every day';
        if (rule.weekdays.length === 5 && 
            rule.weekdays.includes(1) && rule.weekdays.includes(2) && 
            rule.weekdays.includes(3) && rule.weekdays.includes(4) && 
            rule.weekdays.includes(5)) {
          return 'Weekdays';
        }
        const days = rule.weekdays.map(d => shortWeekdays[d]).join(', ');
        return rule.interval === 1 ? `Weekly on ${days}` : `Every ${rule.interval} weeks on ${days}`;
      }
      return rule.interval === 1 ? 'Weekly' : `Every ${rule.interval} weeks`;
      
    case 'monthly':
      if (rule.monthDay) {
        const suffix = getOrdinalSuffix(rule.monthDay);
        return rule.interval === 1 
          ? `Monthly on the ${rule.monthDay}${suffix}` 
          : `Every ${rule.interval} months on the ${rule.monthDay}${suffix}`;
      }
      if (rule.monthWeek !== undefined && rule.monthWeekday !== undefined) {
        const weekNum = rule.monthWeek === -1 ? 'last' : getOrdinalSuffix(rule.monthWeek);
        const weekName = rule.monthWeek === -1 ? '' : `${rule.monthWeek}`;
        const day = weekdays[rule.monthWeekday];
        return rule.interval === 1 
          ? `Monthly on the ${weekName}${weekNum} ${day}` 
          : `Every ${rule.interval} months on the ${weekName}${weekNum} ${day}`;
      }
      return rule.interval === 1 ? 'Monthly' : `Every ${rule.interval} months`;
      
    case 'custom':
      return `Every ${rule.interval} days`;
      
    default:
      return 'Recurring';
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ===================
// Trash Operations
// ===================

export async function getTrash(db: D1Database, type?: string): Promise<{
  boards: Board[];
  columns: Column[];
  tasks: Task[];
}> {
  const result: { boards: Board[]; columns: Column[]; tasks: Task[] } = {
    boards: [],
    columns: [],
    tasks: []
  };
  
  if (!type || type === 'board') {
    const boards = await db.prepare('SELECT * FROM boards WHERE deleted_at IS NOT NULL').all<Board>();
    result.boards = boards.results || [];
  }
  
  if (!type || type === 'column') {
    const columns = await db.prepare('SELECT * FROM columns WHERE deleted_at IS NOT NULL').all<Column>();
    result.columns = columns.results || [];
  }
  
  if (!type || type === 'task') {
    const tasks = await db.prepare('SELECT * FROM tasks WHERE deleted_at IS NOT NULL').all<Task>();
    result.tasks = (tasks.results || []).map(t => ({
      ...t,
      tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags,
      recurrence_rule: t.recurrence_rule ? (typeof t.recurrence_rule === 'string' ? JSON.parse(t.recurrence_rule) : t.recurrence_rule) : null,
      is_recurrence_instance: Boolean(t.is_recurrence_instance)
    }));
  }
  
  return result;
}

export async function restoreFromTrash(
  db: D1Database, 
  type: 'board' | 'column' | 'task', 
  id: string
): Promise<boolean> {
  const table = type === 'board' ? 'boards' : type === 'column' ? 'columns' : 'tasks';
  
  const result = await db.prepare(`
    UPDATE ${table} SET deleted_at = NULL, updated_at = ? WHERE id = ?
  `).bind(now(), id).run();
  
  return result.meta.changes > 0;
}

// ===================
// Activity Log Operations
// ===================

export async function logActivity(
  db: D1Database,
  entityType: ActivityEntityType,
  entityId: string,
  action: ActivityAction,
  details: Record<string, unknown> = {}
): Promise<void> {
  const id = generateId('activity');
  const timestamp = now();
  
  await db.prepare(`
    INSERT INTO activity_log (id, entity_type, entity_id, action, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    entityType,
    entityId,
    action,
    JSON.stringify(details),
    timestamp
  ).run();
}

export async function getActivityLogs(
  db: D1Database,
  options: {
    entityType?: ActivityEntityType;
    entityId?: string;
    boardId?: string;
    action?: ActivityAction;
    limit?: number;
    offset?: number;
  } = {}
): Promise<ActivityLog[]> {
  let query = 'SELECT * FROM activity_log WHERE 1=1';
  const params: unknown[] = [];
  
  if (options.entityType && options.entityId) {
    query += ' AND entity_type = ? AND entity_id = ?';
    params.push(options.entityType, options.entityId);
  } else if (options.boardId) {
    // For board-level activity, get all activities for tasks in that board
    query += ` AND (
      (entity_type = 'task' AND entity_id IN (SELECT id FROM tasks WHERE board_id = ?))
      OR (entity_type = 'board' AND entity_id = ?)
      OR (entity_type = 'column' AND entity_id IN (SELECT id FROM columns WHERE board_id = ?))
    )`;
    params.push(options.boardId, options.boardId, options.boardId);
  }
  
  if (options.action) {
    query += ' AND action = ?';
    params.push(options.action);
  }
  
  query += ' ORDER BY created_at DESC';
  
  if (options.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
    
    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }
  }
  
  const result = await db.prepare(query).bind(...params).all<ActivityLog>();
  const logs = (result.results || []).map((log: ActivityLog) => ({
    ...log,
    details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details
  }));
  
  return logs;
}
