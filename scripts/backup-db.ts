// scripts/backup-db.ts
import { backupDatabase } from '@/lib/db/init';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('backup-db');

async function main() {
  try {
    const backupPath = await backupDatabase();
    logger.info({ path: backupPath }, 'Backup created');
    process.exit(0);
  } catch (error) {
    logger.fatal({ error }, 'Failed to backup database');
    process.exit(1);
  }
}

main();
