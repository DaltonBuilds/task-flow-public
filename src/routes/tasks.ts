// Task API routes
import { Hono } from 'hono';
import type { Bindings, RecurrenceRule } from '../types';
import * as db from '../services/db';
import { validateTitle, validateDescription, validatePriority, validateTags, validateDate, validateId, validateSortField, validateSortOrder, sanitizeString } from '../utils/validation';
import { getLogger } from '../utils/logger';

const tasks = new Hono<{ Bindings: Bindings }>();

// GET /api/boards/:boardId/tasks - List tasks for a board
tasks.get('/boards/:boardId/tasks', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    const columnId = c.req.query('column_id');
    const priority = c.req.query('priority');
    const tag = c.req.query('tag');
    const includeArchived = c.req.query('include_archived') === 'true';
    const includeDeleted = c.req.query('include_deleted') === 'true';
    const sort = c.req.query('sort');
    const order = c.req.query('order') as 'asc' | 'desc' | undefined;
    
    // Validate board ID
    const boardIdValidation = validateId(boardId, 'Board ID');
    if (!boardIdValidation.valid) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: boardIdValidation.error }
      }, 400);
    }
    
    // Validate sort field and order if provided
    if (sort) {
      const sortValidation = validateSortField(sort);
      if (!sortValidation.valid) {
        return c.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: sortValidation.error }
        }, 400);
      }
    }
    
    if (order) {
      const orderValidation = validateSortOrder(order);
      if (!orderValidation.valid) {
        return c.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: orderValidation.error }
        }, 400);
      }
    }
    
    // Validate priority if provided
    if (priority) {
      const priorityValidation = validatePriority(priority);
      if (!priorityValidation.valid) {
        return c.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: priorityValidation.error }
        }, 400);
      }
    }
    
    const data = await db.getTasks(c.env.DB, boardId, {
      columnId,
      priority,
      tag,
      includeArchived,
      includeDeleted,
      sort,
      order
    });
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching tasks', { boardId: c.req.param('boardId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tasks' }
    }, 500);
  }
});

// GET /api/tasks/:taskId - Get single task
tasks.get('/tasks/:taskId', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const data = await db.getTaskById(c.env.DB, taskId);
    
    if (!data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      }, 404);
    }
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching task', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch task' }
    }, 500);
  }
});

// POST /api/boards/:boardId/tasks - Create new task
tasks.post('/boards/:boardId/tasks', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    const body = await c.req.json();
    
    // Validate board ID
    const boardIdValidation = validateId(boardId, 'Board ID');
    if (!boardIdValidation.valid) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: boardIdValidation.error }
      }, 400);
    }
    
    // Validate title
    const titleValidation = validateTitle(body.title);
    if (!titleValidation.valid) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: titleValidation.error }
      }, 400);
    }
    
    // Validate column ID
    const columnIdValidation = validateId(body.column_id, 'Column ID');
    if (!columnIdValidation.valid) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: columnIdValidation.error }
      }, 400);
    }
    
    // Validate description if provided
    if (body.description !== undefined) {
      const descValidation = validateDescription(body.description);
      if (!descValidation.valid) {
        return c.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: descValidation.error }
        }, 400);
      }
    }
    
    // Validate priority if provided
    if (body.priority !== undefined) {
      const priorityValidation = validatePriority(body.priority);
      if (!priorityValidation.valid) {
        return c.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: priorityValidation.error }
        }, 400);
      }
    }
    
    // Validate tags if provided
    if (body.tags !== undefined) {
      const tagsValidation = validateTags(body.tags);
      if (!tagsValidation.valid) {
        return c.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: tagsValidation.error }
        }, 400);
      }
    }
    
    // Validate due date if provided
    if (body.due_date !== undefined && body.due_date !== null) {
      const dateValidation = validateDate(body.due_date);
      if (!dateValidation.valid) {
        return c.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: dateValidation.error }
        }, 400);
      }
    }
    
    // Sanitize inputs
    const sanitizedTitle = sanitizeString(body.title);
    const sanitizedDescription = body.description ? sanitizeString(body.description) : undefined;
    
    const data = await db.createTask(c.env.DB, boardId, {
      column_id: body.column_id,
      title: sanitizedTitle,
      description: sanitizedDescription,
      priority: body.priority,
      due_date: body.due_date,
      tags: body.tags,
      position: body.position,
      recurrence_rule: body.recurrence_rule,
      recurrence_end_date: body.recurrence_end_date,
      recurrence_count: body.recurrence_count
    });
    
    return c.json({ success: true, data }, 201);
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error creating task', { boardId: c.req.param('boardId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create task' }
    }, 500);
  }
});

// PATCH /api/tasks/:taskId - Update task
tasks.patch('/tasks/:taskId', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const body = await c.req.json();
    
    const data = await db.updateTask(c.env.DB, taskId, body);
    
    if (!data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      }, 404);
    }
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error updating task', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update task' }
    }, 500);
  }
});

// DELETE /api/tasks/:taskId - Delete task (soft)
tasks.delete('/tasks/:taskId', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    
    const success = await db.deleteTask(c.env.DB, taskId);
    
    if (!success) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      }, 404);
    }
    
    return c.json({ success: true, data: { deleted: true } });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error deleting task', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete task' }
    }, 500);
  }
});

// POST /api/tasks/:taskId/archive - Archive a task
tasks.post('/tasks/:taskId/archive', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    
    const data = await db.updateTask(c.env.DB, taskId, {
      archived_at: new Date().toISOString()
    });
    
    if (!data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      }, 404);
    }
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error archiving task', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to archive task' }
    }, 500);
  }
});

// POST /api/tasks/:taskId/unarchive - Restore a task from archive
tasks.post('/tasks/:taskId/unarchive', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    
    const data = await db.updateTask(c.env.DB, taskId, {
      archived_at: null
    });
    
    if (!data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      }, 404);
    }
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error unarchiving task', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to unarchive task' }
    }, 500);
  }
});

// POST /api/tasks/:taskId/complete-recurring - Complete a recurring task and create next occurrence
tasks.post('/tasks/:taskId/complete-recurring', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const body = await c.req.json();
    const action = body.action || 'archive'; // 'archive', 'delete', or 'complete' (move to done column)
    const doneColumnId = body.done_column_id; // Required if action is 'complete'
    
    const task = await db.getTaskById(c.env.DB, taskId);
    
    if (!task) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      }, 404);
    }
    
    if (!task.recurrence_rule) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Task is not recurring' }
      }, 400);
    }
    
    // Create the next occurrence first
    const nextTask = await db.createNextRecurrence(c.env.DB, task);
    
    // Handle the current task based on action
    let updatedTask;
    if (action === 'archive') {
      updatedTask = await db.updateTask(c.env.DB, taskId, {
        archived_at: new Date().toISOString()
      });
    } else if (action === 'delete') {
      await db.deleteTask(c.env.DB, taskId);
      updatedTask = null;
    } else if (action === 'complete' && doneColumnId) {
      updatedTask = await db.updateTask(c.env.DB, taskId, {
        column_id: doneColumnId
      });
    }
    
    return c.json({ 
      success: true, 
      data: { 
        completed_task: updatedTask,
        next_task: nextTask,
        has_more_recurrences: nextTask !== null
      } 
    });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error completing recurring task', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to complete recurring task' }
    }, 500);
  }
});

// POST /api/tasks/:taskId/skip-occurrence - Skip a recurring task occurrence
tasks.post('/tasks/:taskId/skip-occurrence', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    
    const task = await db.getTaskById(c.env.DB, taskId);
    
    if (!task) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      }, 404);
    }
    
    if (!task.recurrence_rule) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Task is not recurring' }
      }, 400);
    }
    
    // Calculate the next due date
    const nextDueDate = task.due_date 
      ? db.calculateNextOccurrence(task.due_date, task.recurrence_rule)
      : db.calculateNextOccurrence(new Date().toISOString().split('T')[0], task.recurrence_rule);
    
    // Check if past end date
    if (task.recurrence_end_date && nextDueDate > task.recurrence_end_date) {
      // Remove recurrence if we're past the end date
      const updatedTask = await db.updateTask(c.env.DB, taskId, {
        recurrence_rule: null,
        recurrence_end_date: null,
        recurrence_count: null
      });
      return c.json({ 
        success: true, 
        data: { 
          task: updatedTask,
          skipped: false,
          message: 'Recurrence ended - past end date'
        } 
      });
    }
    
    // Check if we've hit the count limit
    const completedCount = (task.recurrence_completed_count || 0) + 1;
    if (task.recurrence_count && completedCount >= task.recurrence_count) {
      const updatedTask = await db.updateTask(c.env.DB, taskId, {
        recurrence_rule: null,
        recurrence_end_date: null,
        recurrence_count: null,
        recurrence_completed_count: completedCount
      });
      return c.json({ 
        success: true, 
        data: { 
          task: updatedTask,
          skipped: false,
          message: 'Recurrence ended - reached occurrence limit'
        } 
      });
    }
    
    // Update the task with new due date
    const updatedTask = await db.updateTask(c.env.DB, taskId, {
      due_date: nextDueDate,
      recurrence_completed_count: completedCount
    });
    
    return c.json({ 
      success: true, 
      data: { 
        task: updatedTask,
        skipped: true,
        next_due_date: nextDueDate
      } 
    });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error skipping occurrence', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to skip occurrence' }
    }, 500);
  }
});

// GET /api/tasks/:taskId/recurrence-summary - Get human-readable recurrence summary
tasks.get('/tasks/:taskId/recurrence-summary', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    
    const task = await db.getTaskById(c.env.DB, taskId);
    
    if (!task) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      }, 404);
    }
    
    if (!task.recurrence_rule) {
      return c.json({ 
        success: true, 
        data: { 
          is_recurring: false,
          summary: null
        } 
      });
    }
    
    const summary = db.getRecurrenceSummary(task.recurrence_rule);
    
    return c.json({ 
      success: true, 
      data: { 
        is_recurring: true,
        summary,
        rule: task.recurrence_rule,
        end_date: task.recurrence_end_date,
        count: task.recurrence_count,
        completed_count: task.recurrence_completed_count
      } 
    });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error getting recurrence summary', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get recurrence summary' }
    }, 500);
  }
});

// GET /api/boards/:boardId/archive - Get archived tasks for a board
tasks.get('/boards/:boardId/archive', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    
    // Get all archived tasks for this board
    const result = await c.env.DB.prepare(`
      SELECT t.*, c.name as column_name
      FROM tasks t
      LEFT JOIN columns c ON t.column_id = c.id
      WHERE t.board_id = ? AND t.archived_at IS NOT NULL AND t.deleted_at IS NULL
      ORDER BY t.archived_at DESC
    `).bind(boardId).all();
    
    const tasks = result.results.map((task: Record<string, unknown>) => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags as string) : [],
      recurrence_rule: task.recurrence_rule ? JSON.parse(task.recurrence_rule as string) : null,
      is_recurrence_instance: Boolean(task.is_recurrence_instance)
    }));
    
    return c.json({ success: true, data: tasks });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching archived tasks', { boardId: c.req.param('boardId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch archived tasks' }
    }, 500);
  }
});

// POST /api/boards/:boardId/archive-all - Archive all tasks in Done column
tasks.post('/boards/:boardId/archive-all', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    const body = await c.req.json();
    const columnId = body.column_id;
    
    if (!columnId) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Column ID is required' }
      }, 400);
    }
    
    const now = new Date().toISOString();
    
    // Archive all non-archived tasks in the specified column
    const result = await c.env.DB.prepare(`
      UPDATE tasks 
      SET archived_at = ?, updated_at = ?
      WHERE board_id = ? AND column_id = ? AND archived_at IS NULL AND deleted_at IS NULL
    `).bind(now, now, boardId, columnId).run();
    
    return c.json({ 
      success: true, 
      data: { archived_count: result.meta.changes } 
    });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error archiving all tasks', { boardId: c.req.param('boardId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to archive tasks' }
    }, 500);
  }
});

// POST /api/boards/:boardId/auto-archive - Process auto-archive for columns with auto_archive enabled
tasks.post('/boards/:boardId/auto-archive', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    const now = new Date();
    
    // Get all columns with auto_archive enabled
    const columnsResult = await c.env.DB.prepare(`
      SELECT id, auto_archive_days FROM columns 
      WHERE board_id = ? AND auto_archive = 1 AND deleted_at IS NULL
    `).bind(boardId).all();
    
    let totalArchived = 0;
    
    for (const column of columnsResult.results) {
      const col = column as { id: string; auto_archive_days: number };
      const cutoffDate = new Date(now.getTime() - (col.auto_archive_days * 24 * 60 * 60 * 1000));
      const cutoffIso = cutoffDate.toISOString();
      
      // Archive tasks that have been in this column longer than auto_archive_days
      const result = await c.env.DB.prepare(`
        UPDATE tasks 
        SET archived_at = ?, updated_at = ?
        WHERE column_id = ? AND archived_at IS NULL AND deleted_at IS NULL
        AND updated_at < ?
      `).bind(now.toISOString(), now.toISOString(), col.id, cutoffIso).run();
      
      totalArchived += result.meta.changes || 0;
    }
    
    return c.json({ 
      success: true, 
      data: { archived_count: totalArchived } 
    });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error processing auto-archive', { boardId: c.req.param('boardId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to process auto-archive' }
    }, 500);
  }
});

// GET /api/search - Global search across all projects
tasks.get('/search', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const boardId = c.req.query('board_id'); // Optional: filter to specific board
    const priority = c.req.query('priority');
    const dueFilter = c.req.query('due'); // overdue, today, week, no_date
    const tag = c.req.query('tag');
    const limit = parseInt(c.req.query('limit') || '50');
    
    if (query.length < 1 && !priority && !dueFilter && !tag) {
      return c.json({ success: true, data: [] });
    }
    
    // Build the search query
    let sql = `
      SELECT 
        t.id, t.board_id, t.column_id, t.title, t.description, t.priority, 
        t.due_date, t.tags, t.position, t.created_at, t.updated_at, t.archived_at,
        b.name as board_name, b.icon as board_icon,
        c.name as column_name
      FROM tasks t
      LEFT JOIN boards b ON t.board_id = b.id
      LEFT JOIN columns c ON t.column_id = c.id
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
        AND b.deleted_at IS NULL
    `;
    const params: any[] = [];
    
    // Text search in title, description, tags
    if (query) {
      sql += ` AND (
        t.title LIKE ? OR 
        t.description LIKE ? OR 
        t.tags LIKE ?
      )`;
      const searchPattern = `%${query}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Board filter
    if (boardId) {
      sql += ` AND t.board_id = ?`;
      params.push(boardId);
    }
    
    // Priority filter
    if (priority) {
      sql += ` AND t.priority = ?`;
      params.push(priority);
    }
    
    // Tag filter
    if (tag) {
      sql += ` AND t.tags LIKE ?`;
      params.push(`%"${tag}"%`);
    }
    
    // Due date filter
    if (dueFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);
      const weekStr = endOfWeek.toISOString().split('T')[0];
      
      switch (dueFilter) {
        case 'overdue':
          sql += ` AND DATE(t.due_date) < DATE(?)`;
          params.push(todayStr);
          break;
        case 'today':
          sql += ` AND DATE(t.due_date) = DATE(?)`;
          params.push(todayStr);
          break;
        case 'week':
          sql += ` AND DATE(t.due_date) >= DATE(?) AND DATE(t.due_date) <= DATE(?)`;
          params.push(todayStr, weekStr);
          break;
        case 'no_date':
          sql += ` AND t.due_date IS NULL`;
          break;
      }
    }
    
    sql += ` ORDER BY t.updated_at DESC LIMIT ?`;
    params.push(limit);
    
    const result = await c.env.DB.prepare(sql).bind(...params).all();
    
    // Parse tags and recurrence JSON and format results
    const tasks = (result.results || []).map((task: Record<string, unknown>) => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags as string) : [],
      recurrence_rule: task.recurrence_rule ? JSON.parse(task.recurrence_rule as string) : null,
      is_recurrence_instance: Boolean(task.is_recurrence_instance)
    }));
    
    return c.json({ success: true, data: tasks });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error searching tasks', { boardId: c.req.param('boardId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to search tasks' }
    }, 500);
  }
});

export default tasks;
