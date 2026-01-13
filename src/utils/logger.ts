// Structured logging utility for production-ready error handling
import type { Context } from 'hono';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  userId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Get log level based on environment
 */
function getLogLevel(env: string | undefined): LogLevel[] {
  const environment = env || 'development';
  
  if (environment === 'production') {
    return ['info', 'warn', 'error'];
  }
  
  return ['debug', 'info', 'warn', 'error'];
}

/**
 * Format error for logging (sanitized for production)
 */
function formatError(error: unknown, environment?: string): LogEntry['error'] {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      code: (error as { code?: string }).code,
      // Only include stack in development
      stack: environment === 'development' ? error.stack : undefined,
    };
  }
  
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
    };
  }
  
  return {
    name: 'UnknownError',
    message: 'An unknown error occurred',
  };
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown,
  environment?: string
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
  
  if (error) {
    entry.error = formatError(error, environment);
  }
  
  return entry;
}

/**
 * Log an entry (structured JSON in production, readable in development)
 */
function logEntry(entry: LogEntry, environment: string | undefined): void {
  const env = environment || 'development';
  
  if (env === 'production') {
    // Structured JSON logging for production (can be parsed by log aggregators)
    console.log(JSON.stringify(entry));
  } else {
    // Human-readable logging for development
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error 
      ? `\n  Error: ${entry.error.name}: ${entry.error.message}${entry.error.stack ? `\n  ${entry.error.stack}` : ''}`
      : '';
    
    console.log(`${prefix} ${entry.message}${contextStr}${errorStr}`);
  }
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private environment: string | undefined;
  private enabledLevels: LogLevel[];
  
  constructor(environment?: string) {
    this.environment = environment;
    this.enabledLevels = getLogLevel(environment);
  }
  
  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    if (this.enabledLevels.includes('debug')) {
      logEntry(createLogEntry('debug', message, context), this.environment);
    }
  }
  
  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (this.enabledLevels.includes('info')) {
      logEntry(createLogEntry('info', message, context), this.environment);
    }
  }
  
  /**
   * Log a warning
   */
  warn(message: string, context?: LogContext, error?: unknown): void {
    if (this.enabledLevels.includes('warn')) {
      logEntry(createLogEntry('warn', message, context, error, this.environment), this.environment);
    }
  }
  
  /**
   * Log an error (sanitized for production)
   */
  error(message: string, context?: LogContext, error?: unknown): void {
    if (this.enabledLevels.includes('error')) {
      logEntry(createLogEntry('error', message, context, error, this.environment), this.environment);
    }
  }
  
  /**
   * Create a logger with context from Hono request
   */
  withContext(c: Context): Logger {
    const requestId = c.get('requestId') as string | undefined;
    const context: LogContext = {
      requestId,
      path: c.req.path,
      method: c.req.method,
    };
    
    const logger = new Logger(this.environment);
    logger.context = context;
    return logger;
  }
  
  private context?: LogContext;
  
  /**
   * Get current context
   */
  getContext(): LogContext | undefined {
    return this.context;
  }
}

/**
 * Create a logger instance
 */
export function createLogger(environment?: string): Logger {
  return new Logger(environment);
}

/**
 * Get logger from Hono context
 */
export function getLogger(c: Context): Logger {
  const logger = c.get('logger') as Logger | undefined;
  if (logger) {
    return logger;
  }
  
  // Create new logger if not found
  const env = c.env.ENVIRONMENT;
  const newLogger = createLogger(env);
  return newLogger.withContext(c);
}
