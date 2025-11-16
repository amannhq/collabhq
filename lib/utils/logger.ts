// lib/utils/logger.ts
/**
 * Simple console-based logger for Bun compatibility
 * 
 * NOTE: Removed Pino because it uses worker_threads features not supported by Bun
 * This is a lightweight alternative that works in both Node.js and Bun environments
 */

// Detect if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get log level from environment variable, default to 'info'
const LOG_LEVEL = isBrowser ? 'info' : (process.env.LOG_LEVEL || 'info');
const NODE_ENV = isBrowser ? 'development' : (process.env.NODE_ENV || 'development');

// Log levels and their numeric values
const LOG_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const;

const currentLogLevel = LOG_LEVELS[LOG_LEVEL as keyof typeof LOG_LEVELS] || LOG_LEVELS.info;

/**
 * Simple logger class that outputs to console
 * Compatible with both Bun and Node.js runtimes
 */
class Logger {
  private baseContext: Record<string, unknown> = {};

  constructor(context: Record<string, unknown> = {}) {
    this.baseContext = context;
  }

  private shouldLog(level: keyof typeof LOG_LEVELS): boolean {
    return LOG_LEVELS[level] >= currentLogLevel;
  }

  private formatLog(level: string, obj: Record<string, unknown>, msg?: string): string {
    const timestamp = new Date().toISOString();
    const logData = {
      level,
      time: timestamp,
      ...this.baseContext,
      ...obj,
      ...(msg && { msg }),
    };
    return JSON.stringify(logData);
  }

  child(context: Record<string, unknown>): Logger {
    return new Logger({
      ...this.baseContext,
      ...context,
    });
  }

  trace(obj: Record<string, unknown>, msg?: string) {
    if (!this.shouldLog('trace')) return;
    console.log(this.formatLog('trace', obj, msg));
  }

  debug(obj: Record<string, unknown>, msg?: string) {
    if (!this.shouldLog('debug')) return;
    console.log(this.formatLog('debug', obj, msg));
  }

  info(obj: Record<string, unknown>, msg?: string) {
    if (!this.shouldLog('info')) return;
    console.log(this.formatLog('info', obj, msg));
  }

  warn(obj: Record<string, unknown>, msg?: string) {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatLog('warn', obj, msg));
  }

  error(obj: Record<string, unknown>, msg?: string) {
    if (!this.shouldLog('error')) return;
    console.error(this.formatLog('error', obj, msg));
  }

  fatal(obj: Record<string, unknown>, msg?: string) {
    if (!this.shouldLog('fatal')) return;
    console.error(this.formatLog('fatal', obj, msg));
  }
}

// Create singleton logger instance
const logger = new Logger();

/**
 * Create child loggers for different modules
 * Each module gets its own logger with a module identifier
 * 
 * @param module - Module name for log identification
 * @returns Child logger instance
 * 
 * @example
 * ```typescript
 * const logger = createLogger('auth-service');
 * logger.info({ userId: '123' }, 'User authenticated');
 * ```
 */
export const createLogger = (module: string) => {
  return logger.child({ module, env: NODE_ENV });
};

// Export default logger
export default logger;

/**
 * Type-safe logging methods for convenience
 * These provide a simpler API while maintaining type safety
 * 
 * @example
 * ```typescript
 * import { log } from '@/lib/utils/logger';
 * 
 * log.info({ userId: '123' }, 'User logged in');
 * log.error({ error }, 'Failed to process request');
 * ```
 */
export const log = {
  trace: (obj: Record<string, unknown>, msg?: string) => logger.trace(obj, msg),
  debug: (obj: Record<string, unknown>, msg?: string) => logger.debug(obj, msg),
  info: (obj: Record<string, unknown>, msg?: string) => logger.info(obj, msg),
  warn: (obj: Record<string, unknown>, msg?: string) => logger.warn(obj, msg),
  error: (obj: Record<string, unknown>, msg?: string) => logger.error(obj, msg),
  fatal: (obj: Record<string, unknown>, msg?: string) => logger.fatal(obj, msg),
};
