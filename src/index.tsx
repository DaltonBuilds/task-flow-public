// Main Hono application for Task Manager
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Bindings, Variables } from './types';
import { initializeDatabase } from './services/db';
import { rateLimitByMethod } from './utils/rateLimit';
import { createLogger, getLogger } from './utils/logger';
import { getEnvConfig, validateEnv } from './utils/env';

// Import routes
import boardsRouter from './routes/boards';
import columnsRouter from './routes/columns';
import tasksRouter from './routes/tasks';
import subtasksRouter from './routes/subtasks';
import commentsRouter from './routes/comments';
import trashRouter from './routes/trash';
import activityRouter from './routes/activity';
import analyticsRouter from './routes/analytics';

// Import template
import { renderIndexHTML } from './templates/index.html';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Request ID middleware - add unique ID to each request for tracking
app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
});

// Cloudflare Access authentication middleware
// Extracts user information from Cloudflare Access headers
app.use('*', async (c, next) => {
  // Cloudflare Access sets these headers after authentication
  const cfAccessJwtAssertion = c.req.header('CF-Access-Jwt-Assertion');
  const cfAccessAuthenticatedUserEmail = c.req.header('CF-Access-Authenticated-User-Email');
  const cfAccessAuthenticatedUserIdentity = c.req.header('CF-Access-Authenticated-User-Identity');
  
  if (cfAccessAuthenticatedUserEmail) {
    // User is authenticated via Cloudflare Access
    c.set('userEmail', cfAccessAuthenticatedUserEmail);
    c.set('userIdentity', cfAccessAuthenticatedUserIdentity || cfAccessAuthenticatedUserEmail);
    
    // Optional: You can decode the JWT if needed for more user info
    // The JWT contains user claims and can be decoded client-side or server-side
    if (cfAccessJwtAssertion) {
      c.set('accessJwt', cfAccessJwtAssertion);
    }
  }
  
  await next();
});

// Logger middleware - attach logger to context
app.use('*', async (c, next) => {
  const env = c.env.ENVIRONMENT;
  const logger = createLogger(env).withContext(c);
  c.set('logger', logger);
  await next();
});

// Environment validation (only log warnings, don't fail)
app.use('*', async (c, next) => {
  const validation = validateEnv(c.env);
  if (validation.warnings.length > 0) {
    const logger = getLogger(c);
    logger.warn('Environment validation warnings', {
      warnings: validation.warnings,
    });
  }
  await next();
});

// CORS Configuration
app.use('/api/*', cors({
  origin: (origin, c) => {
    const env = c.env.ENVIRONMENT || 'development';
    const allowedOrigins = c.env.ALLOWED_ORIGINS 
      ? c.env.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim())
      : [];

    // In development, allow all origins
    if (env === 'development') {
      return origin || '*';
    }

    // In production, validate against allowed origins
    if (allowedOrigins.length === 0) {
      // If no origins configured, allow same origin only
      return origin || null;
    }

    if (!origin) {
      return null; // Reject requests without origin header
    }

    return allowedOrigins.includes(origin) ? origin : null;
  },
  credentials: true,
  maxAge: 86400, // 24 hours
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'CF-Access-Jwt-Assertion', 'CF-Access-Authenticated-User-Email'],
}));

// Request size limit middleware (1MB)
app.use('/api/*', async (c, next) => {
  const contentLength = c.req.header('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > 1024 * 1024) { // 1MB
      return c.json({
        success: false,
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: 'Request body exceeds maximum size of 1MB',
        },
      }, 413);
    }
  }
  await next();
});

// Rate limiting middleware
app.use('/api/*', rateLimitByMethod());

// Cloudflare Access authentication check for protected API routes
// Note: Cloudflare Access protects at the edge, but this provides an additional check
app.use('/api/*', async (c, next) => {
  const userEmail = c.get('userEmail');
  const env = c.env.ENVIRONMENT || 'development';
  
  // In production, require Cloudflare Access authentication
  // In development, allow requests without Access (for local testing)
  if (env === 'production' && !userEmail) {
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required via Cloudflare Access',
      },
    }, 401);
  }
  
  await next();
});

// Middleware
app.use('*', logger());

// Initialize database on first request (now optimized with caching)
app.use('/api/*', async (c, next) => {
  try {
    await initializeDatabase(c.env.DB);
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Database initialization error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, error);
    // Don't block requests if DB init fails - let individual routes handle it
  }
  await next();
});

// Health check with database connectivity
app.get('/api/health', async (c) => {
  const logger = getLogger(c);
  const timestamp = new Date().toISOString();
  
  try {
    // Quick database connectivity check
    await c.env.DB.prepare('SELECT 1').first();
    
    return c.json({
      status: 'ok',
      timestamp,
      version: '1.0.0',
      database: 'connected',
    });
  } catch (error) {
    logger.error('Health check failed - database disconnected', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, error);
    
    return c.json({
      status: 'degraded',
      timestamp,
      version: '1.0.0',
      database: 'disconnected',
    }, 503);
  }
});

// Mount API routes
app.route('/api/boards', boardsRouter);
app.route('/api', columnsRouter);
app.route('/api', tasksRouter);
app.route('/api', subtasksRouter);
app.route('/api', commentsRouter);
app.route('/api/trash', trashRouter);
app.route('/api', activityRouter);
app.route('/api/analytics', analyticsRouter);

// Serve logo SVG
app.get('/logo.svg', (c) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="10" y="4" width="26" height="26" rx="6" fill="#10B981" opacity="0.3"/>
  <rect x="6" y="8" width="26" height="26" rx="6" fill="#10B981" opacity="0.6"/>
  <rect x="2" y="12" width="26" height="26" rx="6" fill="url(#grad1)"/>
  <path d="M9 25L13.5 29.5L21 20" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  return c.body(svg, 200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000' });
});

// Serve main HTML page
app.get('/', (c) => {
  return c.html(renderIndexHTML('/'));
});

export default app;
