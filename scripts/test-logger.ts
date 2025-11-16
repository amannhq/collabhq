// scripts/test-logger.ts
/**
 * Test script to verify worker thread logging
 */

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('test-logger');

console.log('🧪 Testing worker thread logger...\n');

// Test different log levels
logger.trace({ testId: 1 }, 'This is a trace message');
logger.debug({ testId: 2, data: { foo: 'bar' } }, 'This is a debug message');
logger.info({ testId: 3, userId: '123' }, 'User logged in');
logger.warn({ testId: 4, warning: 'disk space low' }, 'Warning message');
logger.error({ testId: 5, error: new Error('Test error') }, 'Error occurred');

// Test child logger
const childLogger = createLogger('child-module');
childLogger.info({ childTest: true }, 'Message from child logger');

console.log('\n✅ Logger test complete! Check logs above.');
console.log('💡 Main thread continued without blocking!\n');

// Give worker thread time to flush logs
setTimeout(() => {
  process.exit(0);
}, 100);
