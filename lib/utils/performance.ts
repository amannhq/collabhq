/**
 * Performance Monitoring Utilities
 *
 * Utilities for tracking and monitoring database query performance
 */

import { createLogger } from './logger';

const logger = createLogger('performance');

interface QueryPerformanceMetrics {
  name: string;
  duration: number;
  success: boolean;
  error?: unknown;
  timestamp: Date;
}

/**
 * Performance thresholds for different query types (in milliseconds)
 */
export const PERFORMANCE_THRESHOLDS = {
  // Simple queries by ID
  SIMPLE_QUERY: 50,
  SIMPLE_QUERY_ALERT: 100,

  // List queries with pagination
  LIST_QUERY: 100,
  LIST_QUERY_ALERT: 500,

  // Aggregation queries
  AGGREGATION_QUERY: 200,
  AGGREGATION_QUERY_ALERT: 1000,

  // Bulk operations
  BULK_OPERATION: 500,
  BULK_OPERATION_ALERT: 2000,

  // Full-text search
  FULL_TEXT_SEARCH: 300,
  FULL_TEXT_SEARCH_ALERT: 1000,
} as const;

/**
 * Tracks query performance and logs slow queries
 *
 * @param name - Name of the query/operation
 * @param fn - Async function to execute
 * @param threshold - Optional custom alert threshold in ms
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * const posts = await trackQueryPerformance('posts-list', () =>
 *   Post.find(query).select('postUrl status').lean()
 * );
 * ```
 */
export async function trackQueryPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  threshold?: number
): Promise<T> {
  const startTime = Date.now();
  const start = performance.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    const preciseMs = performance.now() - start;

    const metrics: QueryPerformanceMetrics = {
      name,
      duration,
      success: true,
      timestamp: new Date(),
    };

    // Check if query exceeds threshold
    const alertThreshold = threshold || PERFORMANCE_THRESHOLDS.LIST_QUERY_ALERT;

    if (duration > alertThreshold) {
      logger.warn(
        {
          ...metrics,
          preciseMs: Math.round(preciseMs * 100) / 100,
          threshold: alertThreshold,
        },
        `Slow query detected: ${name}`
      );
    } else if (process.env.LOG_QUERY_PERFORMANCE === 'true') {
      logger.debug(
        {
          ...metrics,
          preciseMs: Math.round(preciseMs * 100) / 100,
        },
        `Query completed: ${name}`
      );
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    const metrics: QueryPerformanceMetrics = {
      name,
      duration,
      success: false,
      error,
      timestamp: new Date(),
    };

    logger.error({ ...metrics } as unknown as Record<string, unknown>, `Query failed: ${name}`);
    throw error;
  }
}

/**
 * Tracks multiple parallel queries and logs total time
 *
 * @param name - Name of the operation
 * @param queries - Object mapping query names to promise functions
 * @returns Object with the same keys containing query results
 *
 * @example
 * ```typescript
 * const { posts, count, creators } = await trackParallelQueries('dashboard-data', {
 *   posts: () => Post.find(query).limit(10).lean(),
 *   count: () => Post.countDocuments(query),
 *   creators: () => User.find({ organizationId, role: 'creator' }).lean()
 * });
 * ```
 */
export async function trackParallelQueries<T extends Record<string, () => Promise<unknown>>>(
  name: string,
  queries: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const startTime = Date.now();
  const queryNames = Object.keys(queries);

  try {
    const results = await Promise.all(
      Object.values(queries).map(fn => fn())
    );

    const duration = Date.now() - startTime;

    logger.info(
      {
        name,
        duration,
        queryCount: queryNames.length,
        queries: queryNames,
      },
      `Parallel queries completed: ${name}`
    );

    // Map results back to original keys
    const resultObject = {} as { [K in keyof T]: Awaited<ReturnType<T[K]>> };
    queryNames.forEach((key, index) => {
      resultObject[key as keyof T] = results[index] as Awaited<ReturnType<T[typeof key]>>;
    });

    return resultObject;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(
      {
        name,
        duration,
        queryCount: queryNames.length,
        queries: queryNames,
        error,
      },
      `Parallel queries failed: ${name}`
    );

    throw error;
  }
}

/**
 * Decorator for tracking method performance
 *
 * @param threshold - Optional alert threshold in ms
 *
 * @example
 * ```typescript
 * class PostService {
 *   @withPerformanceTracking(100)
 *   async getPosts(query: unknown) {
 *     return Post.find(query).lean();
 *   }
 * }
 * ```
 */
export function withPerformanceTracking(threshold?: number) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const name = `${target?.constructor?.name || 'Unknown'}.${propertyKey}`;
      return trackQueryPerformance(
        name,
        () => originalMethod.apply(this, args),
        threshold
      );
    };

    return descriptor;
  };
}

/**
 * Simple timer for measuring code block performance
 *
 * @example
 * ```typescript
 * const timer = startTimer();
 * // ... do work
 * const elapsed = timer.stop();
 * console.log(`Operation took ${elapsed}ms`);
 * ```
 */
export function startTimer() {
  const start = Date.now();
  const preciseStart = performance.now();

  return {
    stop: () => Date.now() - start,
    stopPrecise: () => Math.round((performance.now() - preciseStart) * 100) / 100,
    elapsed: () => Date.now() - start,
    elapsedPrecise: () => Math.round((performance.now() - preciseStart) * 100) / 100,
  };
}

/**
 * Batch timer for measuring multiple operations
 *
 * @example
 * ```typescript
 * const batch = batchTimer('data-fetch');
 *
 * batch.time('posts', () => Post.find(query).lean());
 * batch.time('creators', () => User.find(query).lean());
 *
 * const summary = batch.summary();
 * console.log(summary); // { total: 250, operations: { posts: 150, creators: 100 } }
 * ```
 */
export function batchTimer(name: string) {
  const operations: Record<string, number> = {};
  const startTime = Date.now();

  return {
    async time<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
      const opStart = Date.now();
      try {
        const result = await fn();
        operations[operationName] = Date.now() - opStart;
        return result;
      } catch (error) {
        operations[operationName] = Date.now() - opStart;
        throw error;
      }
    },

    summary() {
      const total = Date.now() - startTime;
      return {
        name,
        total,
        operations,
        operationCount: Object.keys(operations).length,
      };
    },

    log() {
      const summary = this.summary();
      logger.info(summary, `Batch operation completed: ${name}`);
      return summary;
    },
  };
}
