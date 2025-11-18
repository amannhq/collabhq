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

type LogLevel = keyof typeof LOG_LEVELS;
type ConsoleMethod = 'log' | 'warn' | 'error';

const CONSOLE_METHOD_MAP: Record<LogLevel, ConsoleMethod> = {
  trace: 'log',
  debug: 'log',
  info: 'log',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

const currentLogLevel = LOG_LEVELS[LOG_LEVEL as LogLevel] || LOG_LEVELS.info;

type LogMessage = {
  level: LogLevel;
  context: Record<string, unknown>;
  obj: Record<string, unknown>;
  msg?: string;
};

type WorkerThreadsModule = typeof import('worker_threads');
type WorkerInstance = InstanceType<WorkerThreadsModule['Worker']>;

let workerThreadsModule: WorkerThreadsModule | null | undefined;
let workerThreadsPromise: Promise<WorkerThreadsModule | null> | null = null;
let logWorker: WorkerInstance | null = null;
let workerReady = false;
const pendingMessages: LogMessage[] = [];

const workerConsoleMapLiteral = JSON.stringify(CONSOLE_METHOD_MAP);

const workerScript = `
const { parentPort } = require('worker_threads');
const CONSOLE_METHOD_MAP = ${workerConsoleMapLiteral};

const serializeLog = (level, context, obj, msg) => {
  const logData = {
    level,
    time: new Date().toISOString(),
    ...context,
    ...obj,
  };

  if (msg) {
    logData.msg = msg;
  }

  return JSON.stringify(logData);
};

parentPort.on('message', (message) => {
  const { level, context, obj, msg } = message;
  const method = CONSOLE_METHOD_MAP[level] || 'log';
  console[method](serializeLog(level, context, obj, msg));
});
`;

const serializeLog = (
  level: LogLevel,
  context: Record<string, unknown>,
  obj: Record<string, unknown>,
  msg?: string,
) => {
  const logData: Record<string, unknown> = {
    level,
    time: new Date().toISOString(),
    ...context,
    ...obj,
  };

  if (msg) {
    logData.msg = msg;
  }

  return JSON.stringify(logData);
};

const emitLogSynchronously = (payload: LogMessage) => {
  const method: ConsoleMethod = CONSOLE_METHOD_MAP[payload.level] ?? 'log';
  console[method](serializeLog(payload.level, payload.context, payload.obj, payload.msg));
};

const attachWorkerHandlers = (worker: WorkerInstance) => {
  workerReady = false;

  worker.once('online', () => {
    workerReady = true;
    while (pendingMessages.length > 0) {
      const nextMessage = pendingMessages.shift();
      if (nextMessage) {
        worker.postMessage(nextMessage);
      }
    }
  });

  worker.on('error', (error) => {
    workerReady = false;
    logWorker = null;
    console.error('[logger] worker error', error);
    const queued = pendingMessages.splice(0);
    queued.forEach((message) => emitLogSynchronously(message));
  });

  worker.on('exit', () => {
    workerReady = false;
    logWorker = null;
    const queued = pendingMessages.splice(0);
    queued.forEach((message) => emitLogSynchronously(message));
  });
};

const instantiateWorker = (mod: WorkerThreadsModule): WorkerInstance => {
  const worker = new mod.Worker(workerScript, { eval: true });
  attachWorkerHandlers(worker);
  return worker;
};

const ensureWorker = (): WorkerInstance | null => {
  if (isBrowser) {
    return null;
  }

  if (logWorker) {
    return logWorker;
  }

  if (typeof workerThreadsModule !== 'undefined') {
    if (workerThreadsModule) {
      logWorker = instantiateWorker(workerThreadsModule);
      return logWorker;
    }
    return null;
  }

  if (!workerThreadsPromise) {
    workerThreadsPromise = import('worker_threads')
      .then((mod) => mod as WorkerThreadsModule)
      .catch(() => null)
      .finally(() => {
        workerThreadsPromise = null;
      });

    workerThreadsPromise.then((mod) => {
      workerThreadsModule = mod ?? null;
      if (!mod) {
        const queued = pendingMessages.splice(0);
        queued.forEach((message) => emitLogSynchronously(message));
        return;
      }

      if (!logWorker) {
        logWorker = instantiateWorker(mod);
      }
    });
  }

  return null;
};

const postToWorker = (payload: LogMessage): boolean => {
  const worker = ensureWorker();
  if (!worker) {
    const workerInitPending =
      !isBrowser &&
      (typeof workerThreadsModule === 'undefined' || workerThreadsPromise !== null);

    if (workerInitPending) {
      pendingMessages.push(payload);
      return true;
    }

    return false;
  }

  if (workerReady) {
    worker.postMessage(payload);
  } else {
    pendingMessages.push(payload);
  }

  return true;
};

/**
 * Simple logger class that outputs to console without blocking
 * Compatible with both Bun and Node.js runtimes
 */
class Logger {
  private baseContext: Record<string, unknown> = {};

  constructor(context: Record<string, unknown> = {}) {
    this.baseContext = context;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= currentLogLevel;
  }

  private logWithLevel(level: LogLevel, obj: Record<string, unknown>, msg?: string) {
    if (!this.shouldLog(level)) return;

    const payload: LogMessage = {
      level,
      context: { ...this.baseContext },
      obj: { ...obj },
      msg,
    };

    if (!postToWorker(payload)) {
      emitLogSynchronously(payload);
    }
  }

  child(context: Record<string, unknown>): Logger {
    return new Logger({
      ...this.baseContext,
      ...context,
    });
  }

  trace(obj: Record<string, unknown> = {}, msg?: string) {
    this.logWithLevel('trace', obj, msg);
  }

  debug(obj: Record<string, unknown> = {}, msg?: string) {
    this.logWithLevel('debug', obj, msg);
  }

  info(obj: Record<string, unknown> = {}, msg?: string) {
    this.logWithLevel('info', obj, msg);
  }

  warn(obj: Record<string, unknown> = {}, msg?: string) {
    this.logWithLevel('warn', obj, msg);
  }

  error(obj: Record<string, unknown> = {}, msg?: string) {
    this.logWithLevel('error', obj, msg);
  }

  fatal(obj: Record<string, unknown> = {}, msg?: string) {
    this.logWithLevel('fatal', obj, msg);
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
