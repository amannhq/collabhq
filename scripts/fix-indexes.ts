// scripts/fix-indexes.ts
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('fix-indexes');

async function fixIndexes() {
  try {
    logger.info({}, 'Starting index cleanup...');
    
    // Connect to database
    await connectDB();
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Drop problematic indexes
    const collections = [
      { name: 'notifications', indexes: ['expiresAt_1'] },
      { name: 'activity_logs', indexes: ['expiresAt_1'] },
      { name: 'invitations', indexes: ['expiresAt_1'] }
    ];

    for (const { name, indexes } of collections) {
      try {
        const collection = db.collection(name);
        const existingIndexes = await collection.indexes();
        
        logger.info({ collection: name, existingIndexes }, 'Existing indexes');

        for (const indexName of indexes) {
          try {
            await collection.dropIndex(indexName);
            logger.info({ collection: name, index: indexName }, 'Dropped index');
          } catch (error: unknown) {
            const err = error as { code?: number; codeName?: string };
            if (err.code === 27 || err.codeName === 'IndexNotFound') {
              logger.warn({ collection: name, index: indexName }, 'Index not found, skipping');
            } else {
              logger.error({ error, collection: name, index: indexName }, 'Error dropping index');
            }
          }
        }
      } catch (error: unknown) {
        const err = error as { code?: number; codeName?: string };
        if (err.code === 26 || err.codeName === 'NamespaceNotFound') {
          logger.warn({ collection: name }, 'Collection not found, skipping');
        } else {
          logger.error({ error, collection: name }, 'Error processing collection');
        }
      }
    }

    logger.info({}, 'Index cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    logger.fatal({ error }, 'Failed to fix indexes');
    process.exit(1);
  }
}

fixIndexes();
