/**
 * Database Index Verification Script
 * Checks if all required indexes exist and creates missing ones
 */

import connectDB from '../lib/db/mongodb';
import { Post, Project, User, Organization, Notification } from '../lib/db/models';
import mongoose from 'mongoose';

interface IndexInfo {
  key: Record<string, number>;
  name: string;
  ns: string;
  [key: string]: any;
}

async function verifyIndexes() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const models = [
      { name: 'Post', model: Post },
      { name: 'Project', model: Project },
      { name: 'User', model: User },
      { name: 'Organization', model: Organization },
      { name: 'Notification', model: Notification },
    ];

    for (const { name, model } of models) {
      console.log(`\n📊 Checking ${name} collection indexes...`);
      
      try {
        // Get existing indexes
        const collection = mongoose.connection.db?.collection(model.collection.name);
        if (!collection) {
          console.log(`  ❌ Collection ${model.collection.name} not found`);
          continue;
        }

        const existingIndexes = await collection.indexes();
        console.log(`  ✅ Found ${existingIndexes.length} existing indexes:`);
        
        existingIndexes.forEach((index: IndexInfo) => {
          const keys = Object.entries(index.key)
            .map(([key, order]) => `${key}:${order}`)
            .join(', ');
          console.log(`     - ${index.name}: { ${keys} }`);
        });

        // Ensure indexes from schema
        console.log(`  🔨 Ensuring schema indexes...`);
        await model.ensureIndexes();
        
        // Get indexes after ensuring
        const updatedIndexes = await collection.indexes();
        const newIndexCount = updatedIndexes.length - existingIndexes.length;
        
        if (newIndexCount > 0) {
          console.log(`  ✅ Created ${newIndexCount} new index(es)`);
        } else {
          console.log(`  ✅ All schema indexes already exist`);
        }

        // Show index usage stats if available
        if (process.env.SHOW_INDEX_STATS === 'true') {
          console.log(`  📈 Index statistics:`);
          const stats = await collection.stats();
          console.log(`     - Documents: ${stats.count}`);
          console.log(`     - Total size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`     - Index size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${name}:`, error);
      }
    }

    // Check for slow queries (if we have the profiler enabled)
    console.log('\n📊 Checking for slow queries...');
    try {
      const db = mongoose.connection.db;
      if (!db) {
        console.log('  ⚠️  Database connection not available');
      } else {
        const profileLevel = await db.command({ profile: -1 });
        console.log(`  Current profiling level: ${profileLevel.was}`);
        
        if (profileLevel.was === 0) {
          console.log('  ℹ️  Query profiling is disabled. Enable with:');
          console.log('     db.setProfilingLevel(1, { slowms: 100 })');
        }
      }
    } catch (error) {
      console.log('  ⚠️  Could not check profiling status');
    }

    // Recommendations
    console.log('\n💡 Performance Recommendations:');
    console.log('   1. Monitor slow queries using MongoDB Atlas Performance Advisor');
    console.log('   2. Consider compound indexes for common query patterns');
    console.log('   3. Review index usage regularly with explain() plans');
    console.log('   4. Drop unused indexes to improve write performance');
    console.log('   5. Use covered queries where possible (projection with indexed fields)');

    console.log('\n✅ Index verification complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
    process.exit(1);
  }
}

// Run the script
verifyIndexes();

