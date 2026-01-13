// Column API routes
import { Hono } from 'hono';
import type { Bindings } from '../types';
import * as db from '../services/db';
import { getLogger } from '../utils/logger';

const columns = new Hono<{ Bindings: Bindings }>();

// GET /api/boards/:boardId/columns - List columns for a board
columns.get('/boards/:boardId/columns', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    const includeDeleted = c.req.query('include_deleted') === 'true';
    
    const data = await db.getColumns(c.env.DB, boardId, { includeDeleted });
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching columns', { boardId: c.req.param('boardId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch columns' }
    }, 500);
  }
});

// POST /api/boards/:boardId/columns - Create new column
columns.post('/boards/:boardId/columns', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    const body = await c.req.json();
    
    if (!body.name || typeof body.name !== 'string') {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name is required' }
      }, 400);
    }
    
    const data = await db.createColumn(c.env.DB, boardId, {
      name: body.name,
      position: body.position
    });
    
    return c.json({ success: true, data }, 201);
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error creating column', { boardId: c.req.param('boardId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create column' }
    }, 500);
  }
});

// PATCH /api/columns/:columnId - Update column
columns.patch('/columns/:columnId', async (c) => {
  try {
    const columnId = c.req.param('columnId');
    const body = await c.req.json();
    
    const data = await db.updateColumn(c.env.DB, columnId, body);
    
    if (!data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Column not found' }
      }, 404);
    }
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error updating column', { columnId: c.req.param('columnId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update column' }
    }, 500);
  }
});

// DELETE /api/columns/:columnId - Delete column (soft)
columns.delete('/columns/:columnId', async (c) => {
  try {
    const columnId = c.req.param('columnId');
    
    const success = await db.deleteColumn(c.env.DB, columnId);
    
    if (!success) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Column not found' }
      }, 404);
    }
    
    return c.json({ success: true, data: { deleted: true } });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error deleting column', { columnId: c.req.param('columnId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete column' }
    }, 500);
  }
});

export default columns;
