/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Logging Examples Documentation
 * 
 * This file contains example code demonstrating proper logging patterns.
 * Functions and variables are intentionally unused as they serve as documentation.
 */

// Example: Advanced Pino Logger Usage

import { createLogger } from '@/lib/utils/logger';

// ============================================
// 1. Module-Specific Logging
// ============================================

const authLogger = createLogger('auth-service');
const paymentLogger = createLogger('payment-service');

authLogger.info({ userId: '123' }, 'User logged in');
// Output: {"level":"info","module":"auth-service","userId":"123","msg":"User logged in"}

paymentLogger.info({ amount: 100, currency: 'USD' }, 'Payment processed');
// Output: {"level":"info","module":"payment-service","amount":100,"currency":"USD","msg":"Payment processed"}

// ============================================
// 2. Error Logging with Stack Traces
// ============================================

try {
  throw new Error('Database connection failed');
} catch (error) {
  authLogger.error({ 
    error, // Pino automatically serializes Error objects with stack traces
    userId: '123',
    action: 'fetch-user' 
  }, 'Failed to fetch user');
}

// ============================================
// 3. Performance Monitoring
// ============================================

async function processRequest(userId: string) {
  const logger = createLogger('api-handler');
  const startTime = Date.now();
  
  try {
    // Your logic here
    await someAsyncOperation(userId);
    
    const duration = Date.now() - startTime;
    logger.info({ 
      userId, 
      duration, 
      success: true 
    }, 'Request processed');
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ 
      userId, 
      duration, 
      error,
      success: false 
    }, 'Request failed');
  }
}

// ============================================
// 4. Request Tracing
// ============================================

import { randomUUID } from 'crypto';

async function handleAPIRequest(req: Request) {
  const logger = createLogger('api');
  const requestId = randomUUID();
  
  // Create child logger with request context
  const requestLogger = logger.child({ requestId });
  
  requestLogger.info({ 
    method: req.method, 
    url: req.url 
  }, 'Request received');
  
  try {
    const result = await processRequestLogic(req);
    
    requestLogger.info({ 
      statusCode: 200,
      responseTime: 145 
    }, 'Request completed');
    
    return result;
  } catch (error) {
    requestLogger.error({ 
      error,
      statusCode: 500 
    }, 'Request failed');
    
    throw error;
  }
}

// ============================================
// 5. Conditional Logging
// ============================================

const logger = createLogger('data-processor');

function processLargeDataset(data: any[]) {
  // Only log in debug mode
  if (process.env.LOG_LEVEL === 'debug') {
    logger.debug({ 
      itemCount: data.length,
      sample: data.slice(0, 5) 
    }, 'Processing dataset');
  }
  
  // Production-safe logging
  logger.info({ 
    itemCount: data.length 
  }, 'Dataset processing started');
}

// ============================================
// 6. Batch Operation Logging
// ============================================

async function batchImportUsers(users: User[]) {
  const logger = createLogger('batch-importer');
  
  logger.info({ 
    totalUsers: users.length 
  }, 'Starting batch import');
  
  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[]
  };
  
  for (const user of users) {
    try {
      await importUser(user);
      results.success++;
      
      // Log every 100 users
      if (results.success % 100 === 0) {
        logger.debug({ 
          processed: results.success,
          total: users.length 
        }, 'Import progress');
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ userId: user.id, error });
      
      logger.warn({ 
        userId: user.id,
        error 
      }, 'Failed to import user');
    }
  }
  
  logger.info({ 
    results 
  }, 'Batch import completed');
}

// ============================================
// 7. Database Query Logging
// ============================================

async function queryDatabase(query: string, params: any) {
  const logger = createLogger('database');
  const startTime = Date.now();
  
  try {
    logger.debug({ 
      query: query.substring(0, 100), // Truncate long queries
      params 
    }, 'Executing query');
    
    const result = await db.execute(query, params);
    const duration = Date.now() - startTime;
    
    logger.debug({ 
      duration,
      rowCount: result.length,
      query: query.substring(0, 100)
    }, 'Query completed');
    
    // Warn about slow queries
    if (duration > 1000) {
      logger.warn({ 
        duration,
        query: query.substring(0, 100),
        params 
      }, 'Slow query detected');
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error({ 
      error,
      duration,
      query,
      params 
    }, 'Query failed');
    
    throw error;
  }
}

// ============================================
// 8. Cron Job Logging
// ============================================

export async function runDailyCleanupJob() {
  const logger = createLogger('cleanup-job');
  
  logger.info({}, 'Starting daily cleanup job');
  const startTime = Date.now();
  
  try {
    const deletedRecords = await cleanupExpiredRecords();
    const duration = Date.now() - startTime;
    
    logger.info({ 
      deletedRecords,
      duration 
    }, 'Cleanup job completed successfully');
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error({ 
      error,
      duration 
    }, 'Cleanup job failed');
    
    // Send alert for cron failures
    await sendAlert('Cleanup job failed', error);
  }
}

// ============================================
// Helper Functions (Examples)
// ============================================

async function someAsyncOperation(userId: string) {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
}

interface User {
  id: string;
  email: string;
}

async function importUser(user: User) {
  // Simulate import
  await new Promise(resolve => setTimeout(resolve, 10));
}

async function processRequestLogic(req: Request) {
  return { success: true };
}

const db = {
  execute: async (query: string, params: any) => {
    return [];
  }
};

async function cleanupExpiredRecords() {
  return 42;
}

async function sendAlert(message: string, error: any) {
  // Alert implementation
}
