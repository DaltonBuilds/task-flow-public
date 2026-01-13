// Comment API routes
import { Hono } from 'hono';
import type { Bindings } from '../types';
import * as db from '../services/db';
import { validateCommentContent, validateId, sanitizeString } from '../utils/validation';
import { getLogger } from '../utils/logger';

const comments = new Hono<{ Bindings: Bindings }>();

// GET /api/tasks/:taskId/comments - List comments for a task
comments.get('/tasks/:taskId/comments', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    
    // Verify task exists
    const task = await db.getTaskById(c.env.DB, taskId);
    if (!task) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      }, 404);
    }
    
    const data = await db.getComments(c.env.DB, taskId);
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching comments', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch comments' }
    }, 500);
  }
});

// POST /api/tasks/:taskId/comments - Create new comment
comments.post('/tasks/:taskId/comments', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    const body = await c.req.json();
    
    // Validate task ID
    const taskIdValidation = validateId(taskId, 'Task ID');
    if (!taskIdValidation.valid) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: taskIdValidation.error }
      }, 400);
    }
    
    // Validate comment content
    const contentValidation = validateCommentContent(body.content);
    if (!contentValidation.valid) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: contentValidation.error }
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
    
    // Sanitize content
    const sanitizedContent = sanitizeString(body.content);
    
    const data = await db.createComment(c.env.DB, taskId, {
      content: sanitizedContent
    });
    
    return c.json({ success: true, data }, 201);
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error creating comment', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create comment' }
    }, 500);
  }
});

// PATCH /api/comments/:commentId - Update comment
comments.patch('/comments/:commentId', async (c) => {
  try {
    const commentId = c.req.param('commentId');
    const body = await c.req.json();
    
    if (body.content !== undefined && (typeof body.content !== 'string' || body.content.trim() === '')) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Comment content cannot be empty' }
      }, 400);
    }
    
    const data = await db.updateComment(c.env.DB, commentId, {
      content: body.content?.trim()
    });
    
    if (!data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' }
      }, 404);
    }
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error updating comment', { commentId: c.req.param('commentId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update comment' }
    }, 500);
  }
});

// DELETE /api/comments/:commentId - Delete comment
comments.delete('/comments/:commentId', async (c) => {
  try {
    const commentId = c.req.param('commentId');
    
    const success = await db.deleteComment(c.env.DB, commentId);
    
    if (!success) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' }
      }, 404);
    }
    
    return c.json({ success: true, data: { deleted: true } });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error deleting comment', { commentId: c.req.param('commentId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete comment' }
    }, 500);
  }
});

// GET /api/tasks/:taskId/comments/count - Get comment count for a task
comments.get('/tasks/:taskId/comments/count', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    
    const count = await db.getCommentCount(c.env.DB, taskId);
    
    return c.json({ success: true, data: { count } });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching comment count', { taskId: c.req.param('taskId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch comment count' }
    }, 500);
  }
});

export default comments;
