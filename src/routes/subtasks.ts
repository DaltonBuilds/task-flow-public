// Subtask API routes
import { Hono } from 'hono';
import type { Bindings } from '../types';
import * as db from '../services/db';
import { getLogger } from '../utils/logger';

const subtasks = new Hono<{ Bindings: Bindings }>();

// GET /api/tasks/:taskId/subtasks - List subtasks for a task
subtasks.get('/tasks/:taskId/subtasks', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    
    const data = await db.getSubtasks(c.env.DB, taskId);
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching subtasks', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch subtasks' }
    }, 500);
  }
});

// POST /api/tasks/:taskId/subtasks - Create new subtask
subtasks.post('/tasks/:taskId/subtasks', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const body = await c.req.json();
    
    if (!body.title || typeof body.title !== 'string') {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Title is required' }
      }, 400);
    }
    
    // Verify task exists
    const task = await db.getTaskById(c.env.DB, taskId);
    if (!task) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      }, 404);
    }
    
    const data = await db.createSubtask(c.env.DB, taskId, {
      title: body.title,
      position: body.position
    });
    
    return c.json({ success: true, data }, 201);
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error creating subtask', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create subtask' }
    }, 500);
  }
});

// PATCH /api/subtasks/:subtaskId - Update subtask
subtasks.patch('/subtasks/:subtaskId', async (c) => {
  try {
    const subtaskId = c.req.param('subtaskId');
    const body = await c.req.json();
    
    const data = await db.updateSubtask(c.env.DB, subtaskId, body);
    
    if (!data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Subtask not found' }
      }, 404);
    }
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error updating subtask', { subtaskId: c.req.param('subtaskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update subtask' }
    }, 500);
  }
});

// DELETE /api/subtasks/:subtaskId - Delete subtask (hard)
subtasks.delete('/subtasks/:subtaskId', async (c) => {
  try {
    const subtaskId = c.req.param('subtaskId');
    
    const success = await db.deleteSubtask(c.env.DB, subtaskId);
    
    if (!success) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Subtask not found' }
      }, 404);
    }
    
    return c.json({ success: true, data: { deleted: true } });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error deleting subtask', { subtaskId: c.req.param('subtaskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete subtask' }
    }, 500);
  }
});

export default subtasks;
