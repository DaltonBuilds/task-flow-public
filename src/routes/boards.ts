// Board API routes
import { Hono } from 'hono';
import type { Bindings, BoardTemplate } from '../types';
import * as db from '../services/db';
import { validateName, validateDescription, sanitizeString } from '../utils/validation';
import { getLogger } from '../utils/logger';

const boards = new Hono<{ Bindings: Bindings }>();

// GET /api/boards - List all boards
boards.get('/', async (c) => {
  try {
    const includeArchived = c.req.query('include_archived') === 'true';
    const includeDeleted = c.req.query('include_deleted') === 'true';
    
    const data = await db.getBoards(c.env.DB, { includeArchived, includeDeleted });
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    const includeArchived = c.req.query('include_archived') === 'true';
    const includeDeleted = c.req.query('include_deleted') === 'true';
    logger.error('Error fetching boards', {
      includeArchived,
      includeDeleted,
    }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch boards' }
    }, 500);
  }
});

// GET /api/boards/:boardId - Get single board with details
boards.get('/:boardId', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    const data = await db.getBoardWithDetails(c.env.DB, boardId);
    
    if (!data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Board not found' }
      }, 404);
    }
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching board', {
      boardId: c.req.param('boardId'),
    }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch board' }
    }, 500);
  }
});

// POST /api/boards - Create new board
boards.post('/', async (c) => {
  try {
    const body = await c.req.json() as {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      background_type?: 'solid' | 'gradient';
      background_value?: string;
      template?: BoardTemplate;
    };
    
    // Validate name
    const nameValidation = validateName(body.name);
    if (!nameValidation.valid) {
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: nameValidation.error }
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
    
    // Sanitize inputs
    const sanitizedName = sanitizeString(body.name);
    const sanitizedDescription = body.description ? sanitizeString(body.description) : undefined;
    
    const data = await db.createBoard(c.env.DB, {
      name: sanitizedName,
      description: sanitizedDescription,
      icon: body.icon,
      color: body.color,
      background_type: body.background_type,
      background_value: body.background_value,
      template: body.template
    });
    
    return c.json({ success: true, data }, 201);
  } catch (error) {
    const logger = getLogger(c);
    const body = await c.req.json().catch(() => ({})) as { name?: string };
    logger.error('Error creating board', {
      boardName: body.name,
    }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create board' }
    }, 500);
  }
});

// PATCH /api/boards/:boardId - Update board
boards.patch('/:boardId', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    const body = await c.req.json();
    
    const data = await db.updateBoard(c.env.DB, boardId, body);
    
    if (!data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Board not found' }
      }, 404);
    }
    
    return c.json({ success: true, data });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error updating board', {
      boardId: c.req.param('boardId'),
    }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update board' }
    }, 500);
  }
});

// DELETE /api/boards/:boardId - Delete board (soft by default)
boards.delete('/:boardId', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    const hard = c.req.query('hard') === 'true';
    
    const success = await db.deleteBoard(c.env.DB, boardId, hard);
    
    if (!success) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Board not found' }
      }, 404);
    }
    
    return c.json({ success: true, data: { deleted: true } });
  } catch (error) {
    const logger = getLogger(c);
    const boardId = c.req.param('boardId');
    const hard = c.req.query('hard') === 'true';
    logger.error('Error deleting board', {
      boardId,
      hardDelete: hard,
    }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete board' }
    }, 500);
  }
});

export default boards;
