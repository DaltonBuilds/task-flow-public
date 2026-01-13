// Activity Log API routes
import { Hono } from 'hono';
import type { Bindings, ActivityAction } from '../types';
import * as db from '../services/db';
import { getLogger } from '../utils/logger';

const activity = new Hono<{ Bindings: Bindings }>();

// GET /api/tasks/:taskId/activity - Get activity log for a specific task
activity.get('/tasks/:taskId/activity', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const action = c.req.query('action');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const data = await db.getActivityLogs(c.env.DB, {
      entityType: 'task',
      entityId: taskId,
      action: action as ActivityAction | undefined,
      limit,
      offset
    });
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching task activity', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch activity log' }
    }, 500);
  }
});

// GET /api/boards/:boardId/activity - Get activity log for a board (project-level)
activity.get('/boards/:boardId/activity', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    const action = c.req.query('action');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const data = await db.getActivityLogs(c.env.DB, {
      boardId,
      action: action as ActivityAction | undefined,
      limit,
      offset
    });
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching board activity', { boardId: c.req.param('boardId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch activity log' }
    }, 500);
  }
});

export default activity;
