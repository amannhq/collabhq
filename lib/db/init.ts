// src/lib/db/init.ts
import mongoose from 'mongoose';
import connectDB from './mongodb';
import { createLogger } from '@/lib/utils/logger';
import {
  Organization,
  User,
  Project,
  Post,
  Metrics,
  Invitation,
  Notification,
  ActivityLog,
} from './models';

const logger = createLogger('db-init');

/**
 * Initialize database indexes
 * Run this once when setting up the database
 */
export async function initializeDatabase() {
  logger.info({}, 'Initializing database...');
  
  try {
    await connectDB();

    logger.info({}, 'Creating indexes...');
    
    // Create indexes for all models
    await Promise.all([
      Organization.createIndexes(),
      User.createIndexes(),
      Project.createIndexes(),
      Post.createIndexes(),
      Metrics.createIndexes(),
      Invitation.createIndexes(),
      Notification.createIndexes(),
      ActivityLog.createIndexes(),
    ]);
    
    logger.info({}, 'All indexes created successfully');
    
    logger.info({
      indexCount: 8,
    }, 'Database indexes created');
    
    // Optional: Create initial data
    await seedInitialData();

    logger.info({}, 'Database initialization complete');
  } catch (error) {
    logger.error({ error }, 'Database initialization failed');
    throw error;
  }
}

/**
 * Seed initial data (optional)
 */
async function seedInitialData() {
  logger.info({}, 'Seeding initial data...');
  
  // Check if we already have data
  const existingOrg = await Organization.findOne();
  
  if (existingOrg) {
    logger.debug({}, 'Database already has data, skipping seed');
    return;
  }
  
  // You can add seed data here if needed
  logger.info({}, 'Seed data created');
}

/**
 * Clear all collections (use with caution!)
 */
export async function clearDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clear database in production!');
  }
  
  logger.warn({}, 'Clearing database...');
  
  await connectDB();
  
  const collections = [
    'organizations',
    'users',
    'projects',
    'posts',
    'metrics',
    'invitations',
    'notifications',
    'activity_logs',
  ];
  
  for (const collectionName of collections) {
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.collection(collectionName).deleteMany({});
        logger.info({ collection: collectionName }, 'Cleared collection');
      }
    } catch (error) {
      logger.error({ error, collection: collectionName }, 'Error clearing collection');
    }
  }

  logger.info({}, 'Database cleared');
}

/**
 * Backup database to JSON files
 */
export async function backupDatabase(outputDir: string = './backups') {
  logger.info({}, 'Creating database backup...');
  
  await connectDB();
  
  const fs = await import('fs');
  const path = await import('path');
  
  // Create backup directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(outputDir, `backup-${timestamp}`);
  
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  
  // Backup each collection
  const models = {
    organizations: Organization,
    users: User,
    projects: Project,
    posts: Post,
    metrics: Metrics,
    invitations: Invitation,
    notifications: Notification,
    activityLogs: ActivityLog,
  };
  
  for (const [name, Model] of Object.entries(models)) {
    const data = await Model.find({}).lean();
    const filePath = path.join(backupPath, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    logger.info({ collection: name, count: data.length }, 'Backed up collection');
  }
  
  logger.info({ path: backupPath }, 'Backup complete');
  return backupPath;
}