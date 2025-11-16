// scripts/init-db.ts
import { initializeDatabase } from '@/lib/db/init';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('init-db');

async function main() {
  try {
    await initializeDatabase();
    logger.info({}, 'Database initialized successfully');
    process.exit(0);
  } catch (error) {
    logger.fatal({ error }, 'Failed to initialize database');
    process.exit(1);
  }
}

main();