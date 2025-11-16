/**
 * Seed Test Notifications
 * 
 * This script creates sample notifications for testing the notification system.
 * Run with: bun run scripts/seed-notifications.ts
 */

import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/db/models/Notification';
import User from '@/lib/db/models/User';
import Organization from '@/lib/db/models/Organization';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('seed-notifications');

async function seedNotifications() {
  try {
    await connectDB();
    logger.info({}, 'Starting notification seeding...');

    // Find first user and organization
    const user = await User.findOne();
    const org = await Organization.findOne();

    if (!user || !org) {
      logger.error({}, 'No user or organization found. Please seed users/organizations first.');
      return;
    }

    logger.info({ userId: user._id, orgId: org._id }, 'Found user and organization');

    // Clear existing notifications for this user
    await Notification.deleteMany({ recipientId: user._id });
    logger.info({}, 'Cleared existing notifications');

    // Create sample notifications
    const notifications = [
      {
        recipientId: user._id,
        organizationId: org._id,
        type: 'post_submitted',
        priority: 'normal',
        title: 'New Post Submitted',
        message: 'John Doe has submitted a new post for review.',
        actionText: 'Review Post',
        actionUrl: `/${org.slug}/posts/pending`,
        status: 'unread',
        createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      },
      {
        recipientId: user._id,
        organizationId: org._id,
        type: 'metrics_updated',
        priority: 'low',
        title: 'Metrics Updated',
        message: 'Jane Smith updated metrics for "How to Build a SaaS"',
        actionText: 'View Metrics',
        actionUrl: `/${org.slug}/posts`,
        status: 'unread',
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      },
      {
        recipientId: user._id,
        organizationId: org._id,
        type: 'milestone_reached',
        priority: 'high',
        title: '🎉 Milestone Reached!',
        message: 'Congratulations! Your organization has reached 10,000 total impressions!',
        actionText: 'View Analytics',
        actionUrl: `/${org.slug}/analytics`,
        status: 'unread',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        recipientId: user._id,
        organizationId: org._id,
        type: 'creator_joined',
        priority: 'normal',
        title: 'New Creator Joined',
        message: 'Alex Johnson has accepted your invitation and joined the team!',
        actionText: 'View Creator',
        actionUrl: `/${org.slug}/creators`,
        status: 'read',
        readAt: new Date(Date.now() - 1000 * 60 * 60), // Read 1 hour ago
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      },
      {
        recipientId: user._id,
        organizationId: org._id,
        type: 'metrics_reminder',
        priority: 'normal',
        title: 'Metrics Update Reminder',
        message: "Don't forget to update your post metrics this week!",
        actionText: 'Update Metrics',
        actionUrl: `/${org.slug}/posts`,
        status: 'unread',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      },
      {
        recipientId: user._id,
        organizationId: org._id,
        type: 'project_created',
        priority: 'low',
        title: 'New Project Created',
        message: 'A new project "Summer Campaign 2024" has been created.',
        actionText: 'View Project',
        actionUrl: `/${org.slug}/projects`,
        status: 'read',
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      },
      {
        recipientId: user._id,
        organizationId: org._id,
        type: 'system_alert',
        priority: 'urgent',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur on Saturday from 2-4 AM EST.',
        status: 'unread',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      },
    ];

    const created = await Notification.insertMany(notifications);
    
    logger.info({ count: created.length }, 'Created test notifications');

    // Log summary
    const unreadCount = await Notification.countDocuments({
      recipientId: user._id,
      status: 'unread',
    });

    logger.info({
      total: created.length,
      unread: unreadCount,
      read: created.length - unreadCount,
    }, 'Notification seeding completed');

    console.log('\n✅ Notification seeding completed successfully!');
    console.log(`   Total: ${created.length} notifications`);
    console.log(`   Unread: ${unreadCount}`);
    console.log(`   Read: ${created.length - unreadCount}`);
    console.log(`\nTest the notifications at: http://localhost:3000/${org.slug}\n`);

  } catch (error) {
    logger.error({ error }, 'Error seeding notifications');
    console.error('❌ Error seeding notifications:', error);
  } finally {
    process.exit(0);
  }
}

seedNotifications();
