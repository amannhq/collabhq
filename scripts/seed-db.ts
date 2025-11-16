// scripts/seed-db.ts
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { createLogger } from '@/lib/utils/logger';
import { Organization, User, Project, Post, Metrics } from '@/lib/db/models';

const logger = createLogger('seed-db');

async function seedDatabase() {
  logger.info({}, 'Seeding database...');
  
  try {
    await connectDB();
    
    // Check if we already have data
    const existingOrg = await Organization.findOne();
    if (existingOrg) {
      logger.debug({}, 'Database already has data, skipping seed');
      return;
    }

    logger.info({}, 'Creating sample users and organization...');
    
    // Create sample admin user first (to use as owner)
    const admin = await User.create({
      email: 'admin@demo.com',
      name: 'Admin User',
      role: 'admin',
      isActive: true,
      preferences: {
        emailNotifications: true,
        theme: 'light',
      },
    });
    
    logger.info({ email: admin.email, id: admin._id }, 'Created admin user');
    
    // Create a sample organization with admin as owner
    const org = await Organization.create({
      name: 'Demo Company',
      slug: 'demo-company',
      ownerId: admin._id,
      settings: {
        logo: '/images/demo-logo.png',
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
        notificationEmail: 'admin@demo.com',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        emailFromName: 'Demo Company',
        notifications: {
          emailOnNewPost: true,
          emailOnPostApproved: true,
          emailOnPostRejected: true,
          emailOnCreatorJoined: true,
          emailOnWeeklyReport: true,
          emailOnMonthlyReport: false,
        },
      },
      subscription: {
        plan: 'pro',
        status: 'active',
      },
    });
    
    logger.info({ name: org.name, id: org._id }, 'Created organization');
    
    // Update admin with organizationId
    admin.organizationId = org._id;
    await admin.save();
    
    // Create sample creator users
    const creator1 = await User.create({
      email: 'creator1@demo.com',
      name: 'John Creator',
      role: 'creator',
      organizationId: org._id,
      isActive: true,
      creatorProfile: {
        twitterHandle: '@johncreator',
        bio: 'Tech content creator',
        platforms: ['twitter', 'linkedin'],
      },
    });
    
    const creator2 = await User.create({
      email: 'creator2@demo.com',
      name: 'Jane Influencer',
      role: 'creator',
      organizationId: org._id,
      isActive: true,
      creatorProfile: {
        twitterHandle: '@janeinfluencer',
        bio: 'Marketing and growth expert',
        platforms: ['twitter', 'instagram'],
      },
    });
    
    logger.info({ count: 2 }, 'Created creator users');
    
    // Create sample projects
    const project1 = await Project.create({
      name: 'Product Launch Campaign',
      organizationId: org._id,
      createdBy: admin._id,
      description: 'Q4 product launch social media campaign',
      targetMetrics: {
        totalPosts: 10,
        totalImpressions: 100000,
        totalEngagement: 5000,
      },
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      creators: [
        {
          userId: creator1._id,
          name: creator1.name,
          twitterHandle: creator1.creatorProfile?.twitterHandle || '',
          status: 'active',
          joinedAt: new Date(),
        },
        {
          userId: creator2._id,
          name: creator2.name,
          twitterHandle: creator2.creatorProfile?.twitterHandle || '',
          status: 'active',
          joinedAt: new Date(),
        },
      ],
    });
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const project2 = await Project.create({
      name: 'Brand Awareness Initiative',
      organizationId: org._id,
      createdBy: admin._id,
      description: 'Ongoing brand awareness content',
      targetMetrics: {
        totalPosts: 20,
        totalImpressions: 200000,
        totalEngagement: 10000,
      },
      status: 'active',
      startDate: new Date(),
      creators: [
        {
          userId: creator1._id,
          name: creator1.name,
          twitterHandle: creator1.creatorProfile?.twitterHandle || '',
          status: 'active',
          joinedAt: new Date(),
        },
      ],
    });
    
    logger.info({ count: 2 }, 'Created projects');
    
    // Create sample posts
    const post1 = await Post.create({
      organizationId: org._id,
      projectId: project1._id,
      creatorId: creator1._id,
      creatorName: creator1.name,
      twitterHandle: creator1.creatorProfile?.twitterHandle || '',
      platform: 'twitter',
      content: 'Excited to share our new product launch! 🚀',
      postUrl: 'https://twitter.com/johncreator/status/123456',
      scheduledDate: new Date(),
      status: 'approved',
      approvalStatus: 'approved',
      approvedBy: admin._id,
      approvedAt: new Date(),
    });
    
    // Add metrics to the post
    await Metrics.create({
      postId: post1._id,
      organizationId: org._id,
      projectId: project1._id,
      creatorId: creator1._id,
      platform: 'twitter',
      metrics: {
        impressions: 5000,
        likes: 250,
        comments: 30,
        shares: 45,
        engagement: 325,
      },
      recordedAt: new Date(),
      recordedBy: creator1._id,
    });

    logger.info({}, 'Created sample posts and metrics');
    
    logger.info({
      organizations: 1,
      users: 3,
      admins: 1,
      creators: 2,
      projects: 2,
      posts: 1,
    }, 'Seed Summary');
    
    logger.info({}, 'Database seeding complete');
    
    await mongoose.disconnect();
  } catch (error) {
    logger.error({ error }, 'Database seeding failed');
    throw error;
  }
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.fatal({ error }, 'Fatal error during seeding');
    process.exit(1);
  });
