// Trash API routes
import { Hono } from 'hono';
import type { Bindings } from '../types';
import * as db from '../services/db';
import { getLogger } from '../utils/logger';

const trash = new Hono<{ Bindings: Bindings }>();

// GET /api/trash - List all soft-deleted items
trash.get('/', async (c) => {
  try {
    const type = c.req.query('type');
    
    const data = await db.getTrash(c.env.DB, type);
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching trash', { type: c.req.query('type') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trash' }
    }, 500);
  }
});

// POST /api/trash/:type/:id/restore - Restore item from trash
trash.post('/:type/:id/restore', async (c) => {
  try {
    const type = c.req.param('type') as 'board' | 'column' | 'task';
    const id = c.req.param('id');
    
    if (!['board', 'column', 'task'].includes(type)) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid type. Must be board, column, or task' }
      }, 400);
    }
    
    const success = await db.restoreFromTrash(c.env.DB, type, id);
    
    if (!success) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Item not found in trash' }
      }, 404);
    }
    
    return c.json({ success: true, data: { restored: true } });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error restoring from trash', {
      type: c.req.param('type'),
      id: c.req.param('id'),
    }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to restore item' }
    }, 500);
  }
});

export default trash;
