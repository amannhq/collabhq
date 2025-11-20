// scripts/seed-admin-dashboard.ts
// Comprehensive seeding script for admin dashboard data visualization
// This script creates realistic data for projects, creators, posts, metrics, etc.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import mongoose from 'mongoose';
import connectDB from '../lib/db/mongodb';
import {
  Organization,
  User,
  Project,
  Post,
  Metrics,
  Invitation,
  Notification,
  ActivityLog,
} from '../lib/db/models';

// Your existing admin user details
const ADMIN_USER_ID = '6919fc782774ed18979c20e7';
const ORGANIZATION_ID = '6919fc7831dfe55439563f5a';

// Helper function to generate dates in the past
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

// Helper to generate realistic engagement metrics
function generateMetrics(baseImpressions: number, daysSincePost: number) {
  // Engagement decreases over time
  const timeFactor = Math.max(0.3, 1 - daysSincePost * 0.05);
  const impressions = Math.floor(baseImpressions * timeFactor * (0.8 + Math.random() * 0.4));
  const engagementRate = 2 + Math.random() * 6; // 2-8% engagement rate
  const totalEngagement = Math.floor(impressions * (engagementRate / 100));
  
  // Distribute engagement
  const likes = Math.floor(totalEngagement * (0.6 + Math.random() * 0.2)); // 60-80% likes
  const retweets = Math.floor(totalEngagement * (0.1 + Math.random() * 0.1)); // 10-20% retweets
  const replies = Math.floor(totalEngagement * (0.05 + Math.random() * 0.1)); // 5-15% replies
  const quotes = Math.floor(totalEngagement * (0.02 + Math.random() * 0.05)); // 2-7% quotes
  const bookmarks = Math.floor(likes * (0.2 + Math.random() * 0.3)); // 20-50% of likes
  
  return {
    likes,
    retweets,
    replies,
    quotes,
    impressions,
    bookmarks,
    views: Math.floor(impressions * 1.2),
    totalEngagement: likes + retweets + replies + quotes,
    engagementRate: parseFloat(((likes + retweets + replies + quotes) / impressions * 100).toFixed(2)),
  };
}

// Sample data - 2 projects with 18 creators
const projectData = [
  {
    name: 'Tech Innovators Campaign',
    description: 'Promoting cutting-edge technology solutions and innovations',
    status: 'active',
    settings: {
      requirePostApproval: false,
      firstPostRequiresApproval: true,
      metricUpdateFrequency: 24,
      autoReminders: true,
      reminderTime: '09:00',
    },
  },
  {
    name: 'SaaS Product Launch 2025',
    description: 'Pre-launch buzz and product awareness campaign for new SaaS platform',
    status: 'active',
    settings: {
      requirePostApproval: true,
      firstPostRequiresApproval: true,
      metricUpdateFrequency: 12,
      autoReminders: true,
      reminderTime: '10:00',
    },
  },
];

const creatorData = [
  // Project 1 Creators
  { name: 'Sarah Chen', email: 'sarah.chen@example.com', twitterHandle: '@sarahtech', bio: 'Software Engineer | Tech Content Creator | Building in public', status: 'active' },
  { name: 'Marcus Rodriguez', email: 'marcus.r@example.com', twitterHandle: '@marcusbuilds', bio: 'Startup Founder | SaaS Enthusiast | Sharing my journey', status: 'active' },
  { name: 'Priya Sharma', email: 'priya.sharma@example.com', twitterHandle: '@priyacodes', bio: 'Full-stack Developer | Open Source Contributor', status: 'active' },
  { name: 'James Wilson', email: 'james.w@example.com', twitterHandle: '@jameswrites', bio: 'Technical Writer | Developer Advocate | Coffee Addict', status: 'active' },
  { name: 'Emily Zhang', email: 'emily.zhang@example.com', twitterHandle: '@emilydesigns', bio: 'Product Designer | UX/UI | Design Systems', status: 'active' },
  { name: 'Ahmed Hassan', email: 'ahmed.h@example.com', twitterHandle: '@ahmeddevs', bio: 'Backend Engineer | Cloud Architecture | Tech Blogger', status: 'active' },
  { name: 'Lisa Anderson', email: 'lisa.a@example.com', twitterHandle: '@lisagrowth', bio: 'Growth Marketer | SaaS Marketing | Data-Driven', status: 'active' },
  { name: 'David Kim', email: 'david.kim@example.com', twitterHandle: '@davidships', bio: 'Engineering Manager | Team Builder | Agile Advocate', status: 'active' },
  { name: 'Tom Martinez', email: 'tom.m@example.com', twitterHandle: '@tomlaunches', bio: 'Product Manager | 0 to 1 | Startup Life', status: 'active' },
  
  // Project 2 Creators
  { name: 'Olivia Brown', email: 'olivia.b@example.com', twitterHandle: '@oliviacreates', bio: 'Creative Developer | Animation Specialist | JavaScript Lover', status: 'active' },
  { name: 'Carlos Mendez', email: 'carlos.m@example.com', twitterHandle: '@carlosdevs', bio: 'DevOps Engineer | Kubernetes Expert | Cloud Native', status: 'active' },
  { name: 'Aisha Patel', email: 'aisha.p@example.com', twitterHandle: '@aishabuilds', bio: 'Mobile Developer | React Native | iOS & Android', status: 'active' },
  { name: 'Ryan Thompson', email: 'ryan.t@example.com', twitterHandle: '@ryantech', bio: 'Security Engineer | Ethical Hacker | InfoSec Enthusiast', status: 'active' },
  { name: 'Nina Kowalski', email: 'nina.k@example.com', twitterHandle: '@ninacodes', bio: 'AI/ML Engineer | Data Scientist | Python Expert', status: 'active' },
  { name: 'Jordan Lee', email: 'jordan.l@example.com', twitterHandle: '@jordanlaunches', bio: 'Indie Hacker | Building SaaS | Bootstrapped', status: 'active' },
  { name: 'Sophie Martin', email: 'sophie.m@example.com', twitterHandle: '@sophiedesigns', bio: 'Brand Designer | Visual Storyteller | Figma Wizard', status: 'active' },
  { name: 'Alex Kumar', email: 'alex.k@example.com', twitterHandle: '@alexstartup', bio: 'Serial Entrepreneur | Tech Investor | Mentor', status: 'active' },
  { name: 'Maya Okonkwo', email: 'maya.o@example.com', twitterHandle: '@mayawrites', bio: 'Technical Content Writer | Documentation Expert | Dev Advocate', status: 'active' },
];

const postContentSamples = [
  'Just shipped a major feature update! 🚀 Check out what\'s new in our latest release.',
  'Building in public is hard, but the community support makes it worth it. Here\'s what I learned this week...',
  'Hot take: The best code is code you don\'t have to write. Here\'s why...',
  '🧵 Thread: 10 lessons from building a $1M ARR SaaS product',
  'New blog post alert! 📝 "Scaling your application: A practical guide"',
  'Just launched our new feature! Try it out and let me know what you think 👇',
  'Behind the scenes: How we reduced API latency by 60%',
  'Product update: We\'ve been listening to your feedback. Here\'s what\'s coming...',
  'Debugging for 3 hours to find a typo. Classic developer moment 😅',
  'The tech stack that helped us reach 10k users in 3 months',
  'Weekly metrics are in and we\'re crushing it! 📈',
  'Just crossed 1000 users! Thank you to everyone who believed in this project 🙏',
  'Feature request: What would you like to see next in our platform?',
  'Live demo happening now! Join us to see what we\'ve been working on',
  'Case study: How our customer increased conversions by 3x',
];

async function seedData() {
  try {
    console.log('🌱 Starting data seeding process...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Verify admin user and organization exist
    const admin = await User.findById(ADMIN_USER_ID);
    const organization = await Organization.findById(ORGANIZATION_ID);

    if (!admin || !organization) {
      throw new Error('Admin user or organization not found! Please check IDs.');
    }

    console.log(`✅ Found admin: ${admin.name} (${admin.email})`);
    console.log(`✅ Found organization: ${organization.name}\n`);

    // ============================================
    // 1. CREATE PROJECTS
    // ============================================
    console.log('📁 Creating projects...');
    const projects = [];

    for (const projectInfo of projectData) {
      const project = await Project.create({
        organizationId: ORGANIZATION_ID,
        name: projectInfo.name,
        description: projectInfo.description,
        status: projectInfo.status,
        settings: projectInfo.settings,
        createdBy: ADMIN_USER_ID,
        stats: {
          totalCreators: 0,
          activeCreators: 0,
          totalPosts: 0,
          approvedPosts: 0,
          pendingPosts: 0,
          totalEngagement: 0,
          totalImpressions: 0,
          avgEngagementRate: 0,
          lastUpdated: new Date(),
        },
      });
      projects.push(project);
      console.log(`  ✓ Created project: ${project.name}`);
    }
    console.log(`✅ Created ${projects.length} projects\n`);

    // ============================================
    // 2. CREATE CREATORS
    // ============================================
    console.log('👥 Creating creators...');
    const creators = [];

    for (let i = 0; i < creatorData.length; i++) {
      const creatorInfo = creatorData[i];
      const assignedProject = projects[i % 2]; // Distribute evenly across 2 projects
      
      const creator = await User.create({
        email: creatorInfo.email,
        name: creatorInfo.name,
        role: 'creator',
        organizationId: ORGANIZATION_ID,
        emailVerified: creatorInfo.status === 'active',
        loginCount: creatorInfo.status === 'active' ? Math.floor(Math.random() * 20) + 5 : 0,
        lastLoginAt: creatorInfo.status === 'active' ? daysAgo(Math.floor(Math.random() * 7)) : undefined,
        creatorProfile: {
          twitterHandle: creatorInfo.twitterHandle,
          twitterDisplayName: creatorInfo.name,
          bio: creatorInfo.bio,
          projectId: assignedProject._id,
          status: creatorInfo.status as 'active' | 'invited' | 'suspended' | 'inactive',
          invitedBy: admin._id,
          invitedAt: daysAgo(Math.floor(Math.random() * 60) + 30),
          activatedAt: creatorInfo.status === 'active' ? daysAgo(Math.floor(Math.random() * 50) + 10) : undefined,
          stats: {
            totalPosts: 0,
            approvedPosts: 0,
            pendingPosts: 0,
            totalLikes: 0,
            totalRetweets: 0,
            totalImpressions: 0,
            avgEngagementRate: 0,
          },
        },
        preferences: {
          emailNotifications: true,
          reminderFrequency: 24,
          language: 'en',
        },
      });
      
      creators.push(creator);
      console.log(`  ✓ Created creator: ${creator.name} → ${assignedProject.name}`);
    }
    console.log(`✅ Created ${creators.length} creators\n`);

    // ============================================
    // 3. CREATE INVITATIONS
    // ============================================
    console.log('📧 Creating invitations...');
    const invitations = [];

    // Create some pending invitations
    for (let i = 0; i < 5; i++) {
      const project = projects[i % projects.length];
      const invitation = await Invitation.create({
        email: `pending.creator.${i + 1}@example.com`,
        token: `invite-token-${Date.now()}-${i}`,
        organizationId: ORGANIZATION_ID,
        projectId: project._id,
        invitedBy: admin._id,
        creatorData: {
          name: `Pending Creator ${i + 1}`,
          twitterHandle: `@pending${i + 1}`,
          role: 'creator',
          customMessage: 'We\'d love to have you join our creator program!',
        },
        status: i < 3 ? 'pending' : 'accepted',
        sentAt: daysAgo(Math.floor(Math.random() * 14) + 1),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        acceptedAt: i >= 3 ? daysAgo(Math.floor(Math.random() * 10)) : undefined,
        emailDelivery: {
          sent: true,
          sentAt: daysAgo(Math.floor(Math.random() * 14) + 1),
          deliveryStatus: 'delivered',
          opens: Math.floor(Math.random() * 5),
          clicks: Math.floor(Math.random() * 3),
          emailProvider: 'resend',
        },
        metadata: {
          inviteType: 'email',
          source: 'dashboard',
          reminderCount: 0,
        },
      });
      invitations.push(invitation);
    }
    console.log(`✅ Created ${invitations.length} invitations\n`);

    // ============================================
    // 4. CREATE POSTS WITH REALISTIC DISTRIBUTION
    // ============================================
    console.log('📝 Creating posts...');
    const posts = [];
    let totalPostsCreated = 0;

    // Only create posts for active creators
    const activeCreators = creators.filter(c => c.creatorProfile?.status === 'active');

    // Create posts with better time distribution (last 45 days)
    const DAYS_OF_DATA = 45; // Generate 45 days of historical data
    
    for (const creator of activeCreators) {
      // Each creator posts 1-3 times per week, so ~6-18 posts over 45 days
      const numPosts = Math.floor(Math.random() * 12) + 8; // 8-20 posts per creator
      
      // Generate post dates spread across the time period
      const postDates: Date[] = [];
      for (let i = 0; i < numPosts; i++) {
        // Distribute posts across the 45 days with some clustering
        // Some creators post more regularly, others in bursts
        const daysBack = Math.floor((i / numPosts) * DAYS_OF_DATA) + Math.floor(Math.random() * 3);
        postDates.push(daysAgo(daysBack));
      }
      
      // Sort posts by date (oldest first)
      postDates.sort((a, b) => a.getTime() - b.getTime());
      
      for (let i = 0; i < numPosts; i++) {
        const postDate = postDates[i];
        const daysSincePost = Math.floor((Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24));
        const tweetId = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        
        // Determine status (92% approved, 5% pending, 3% rejected)
        let status: 'approved' | 'pending' | 'rejected' = 'approved';
        const statusRoll = Math.random();
        if (statusRoll > 0.97) status = 'rejected';
        else if (statusRoll > 0.92) status = 'pending';
        
        // Vary base impressions - some creators have larger audiences
        const creatorMultiplier = 0.5 + Math.random() * 1.5; // 0.5x to 2x multiplier
        const baseImpressions = (2000 + Math.random() * 12000) * creatorMultiplier; // 1k-28k base impressions
        
        // Some posts go viral (5% chance)
        const isViral = Math.random() > 0.95;
        const viralMultiplier = isViral ? (3 + Math.random() * 5) : 1; // 3x-8x for viral posts
        
        const metrics = generateMetrics(baseImpressions * viralMultiplier, daysSincePost);
        
        const post = await Post.create({
          projectId: creator.creatorProfile?.projectId,
          creatorId: creator._id,
          organizationId: ORGANIZATION_ID,
          postUrl: `https://twitter.com/${creator.creatorProfile?.twitterHandle}/status/${tweetId}`,
          tweetId,
          content: postContentSamples[Math.floor(Math.random() * postContentSamples.length)],
          postedAt: postDate,
          status,
          isFirstPost: i === 0,
          verifiedBy: status !== 'pending' ? admin._id : undefined,
          verifiedAt: status !== 'pending' ? postDate : undefined,
          adminNotes: status === 'approved' ? (isViral ? 'Excellent engagement! 🔥' : 'Great content!') : undefined,
          rejectionReason: status === 'rejected' ? 'Content does not align with project guidelines' : undefined,
          latestMetrics: {
            ...metrics,
            lastUpdatedAt: hoursAgo(Math.floor(Math.random() * 24)),
            updatedBy: creator._id,
          },
          growth: {
            likesDelta: Math.floor(metrics.likes * (0.05 + Math.random() * 0.15)),
            retweetsDelta: Math.floor(metrics.retweets * (0.1 + Math.random() * 0.2)),
            repliesDelta: Math.floor(metrics.replies * (0.15 + Math.random() * 0.25)),
            impressionsDelta: Math.floor(metrics.impressions * (0.03 + Math.random() * 0.1)),
            engagementRateDelta: parseFloat((Math.random() * 3 - 1.5).toFixed(2)),
          },
          reminders: {
            lastSent: hoursAgo(Math.floor(Math.random() * 48)),
            nextDue: new Date(Date.now() + 24 * 60 * 60 * 1000),
            sentCount: Math.floor(Math.random() * 5),
            reminderFrequency: 24,
          },
          metadata: {
            hasMedia: Math.random() > 0.35,
            mediaType: Math.random() > 0.7 ? 'image' : Math.random() > 0.5 ? 'video' : 'gif',
            mediaCount: Math.floor(Math.random() * 4) + 1,
            hasLinks: Math.random() > 0.25,
            linkCount: Math.floor(Math.random() * 3),
            hashtagCount: Math.floor(Math.random() * 6),
            mentionCount: Math.floor(Math.random() * 4),
          },
        });
        
        posts.push(post);
        totalPostsCreated++;
      }
      
      console.log(`  ✓ Created ${numPosts} posts for ${creator.name} (spanning ${DAYS_OF_DATA} days)`);
    }
    console.log(`✅ Created ${totalPostsCreated} posts\n`);

    // ============================================
    // 5. CREATE METRICS HISTORY (Time-series data) - Daily updates for first 15 days, then weekly
    // ============================================
    console.log('📊 Creating metrics history (daily for first 15 days)...');
    let totalMetricsCreated = 0;

    for (const post of posts) {
      if (post.status !== 'approved') continue;
      
      const daysSincePost = Math.floor((Date.now() - post.postedAt!.getTime()) / (1000 * 60 * 60 * 24));
      
      // Create daily updates for first 15 days, then weekly after that
      const dailyUpdateDays = Math.min(daysSincePost, 15);
      const weeklyUpdateDays = Math.max(0, daysSincePost - 15);
      const numWeeklyUpdates = Math.floor(weeklyUpdateDays / 7);
      const totalUpdates = dailyUpdateDays + numWeeklyUpdates;
      
      if (totalUpdates === 0) continue;
      
      let previousMetrics = {
        likes: 0,
        retweets: 0,
        replies: 0,
        quotes: 0,
        impressions: 0,
        bookmarks: 0,
        views: 0,
      };
      
      // Engagement growth curve - fast initial growth, then tapers off
      const generateProgressiveMetrics = (dayIndex: number, totalDays: number) => {
        // Most engagement happens in first 7 days (80%), then gradually decreases
        let progress: number;
        if (dayIndex <= 1) {
          progress = 0.3; // 30% on day 1
        } else if (dayIndex <= 3) {
          progress = 0.5 + (dayIndex - 1) * 0.1; // 50-70% by day 3
        } else if (dayIndex <= 7) {
          progress = 0.7 + (dayIndex - 3) * 0.025; // 70-80% by day 7
        } else if (dayIndex <= 15) {
          progress = 0.8 + (dayIndex - 7) * 0.015; // 80-92% by day 15
        } else {
          // After 15 days, asymptotically approach 100%
          const weeksAfter15 = (dayIndex - 15) / 7;
          progress = 0.92 + (weeksAfter15 / (weeksAfter15 + 2)) * 0.08; // Approaches 100%
        }
        
        return {
          likes: Math.floor(post.latestMetrics.likes * progress),
          retweets: Math.floor(post.latestMetrics.retweets * progress),
          replies: Math.floor(post.latestMetrics.replies * progress),
          quotes: Math.floor(post.latestMetrics.quotes * progress),
          impressions: Math.floor(post.latestMetrics.impressions * progress),
          bookmarks: Math.floor(post.latestMetrics.bookmarks * progress),
          views: Math.floor(post.latestMetrics.views * progress),
        };
      };
      
      let updateIndex = 0;
      
      // Daily updates for first 15 days
      for (let day = 0; day < dailyUpdateDays; day++) {
        const daysAgoForUpdate = daysSincePost - day;
        const updateDate = daysAgo(daysAgoForUpdate);
        
        const currentMetrics = generateProgressiveMetrics(day, totalUpdates);
        
        const totalEngagement = currentMetrics.likes + currentMetrics.retweets + currentMetrics.replies + currentMetrics.quotes;
        const engagementRate = currentMetrics.impressions > 0 
          ? (totalEngagement / currentMetrics.impressions * 100) 
          : 0;
        
        // Calculate deltas
        const likesDelta = currentMetrics.likes - previousMetrics.likes;
        const retweetsDelta = currentMetrics.retweets - previousMetrics.retweets;
        const repliesDelta = currentMetrics.replies - previousMetrics.replies;
        const quotesDelta = currentMetrics.quotes - previousMetrics.quotes;
        const impressionsDelta = currentMetrics.impressions - previousMetrics.impressions;
        const prevTotalEngagement = previousMetrics.likes + previousMetrics.retweets + previousMetrics.replies + previousMetrics.quotes;
        
        await Metrics.create({
          postId: post._id,
          creatorId: post.creatorId,
          projectId: post.projectId,
          organizationId: ORGANIZATION_ID,
          metrics: {
            ...currentMetrics,
            totalEngagement,
            engagementRate: parseFloat(engagementRate.toFixed(2)),
          },
          growth: {
            likesDelta,
            retweetsDelta,
            repliesDelta,
            quotesDelta,
            impressionsDelta,
            engagementDelta: totalEngagement - prevTotalEngagement,
            likesGrowthPercent: previousMetrics.likes > 0 ? parseFloat(((likesDelta / previousMetrics.likes) * 100).toFixed(2)) : 100,
            retweetsGrowthPercent: previousMetrics.retweets > 0 ? parseFloat(((retweetsDelta / previousMetrics.retweets) * 100).toFixed(2)) : 100,
            impressionsGrowthPercent: previousMetrics.impressions > 0 ? parseFloat(((impressionsDelta / previousMetrics.impressions) * 100).toFixed(2)) : 100,
            hoursSinceLastUpdate: day > 0 ? 24 : undefined,
          },
          source: day === 0 ? 'manual' : (Math.random() > 0.4 ? 'reminder' : 'manual'),
          submittedBy: post.creatorId,
          recordedAt: updateDate,
        });
        
        previousMetrics = currentMetrics;
        totalMetricsCreated++;
        updateIndex++;
      }
      
      // Weekly updates after day 15
      for (let week = 0; week < numWeeklyUpdates; week++) {
        const daysAgoForUpdate = daysSincePost - 15 - (week * 7);
        if (daysAgoForUpdate < 0) break;
        
        const updateDate = daysAgo(daysAgoForUpdate);
        const daysSincePostAtUpdate = 15 + (week * 7);
        
        const currentMetrics = generateProgressiveMetrics(daysSincePostAtUpdate, totalUpdates);
        
        const totalEngagement = currentMetrics.likes + currentMetrics.retweets + currentMetrics.replies + currentMetrics.quotes;
        const engagementRate = currentMetrics.impressions > 0 
          ? (totalEngagement / currentMetrics.impressions * 100) 
          : 0;
        
        // Calculate deltas
        const likesDelta = currentMetrics.likes - previousMetrics.likes;
        const retweetsDelta = currentMetrics.retweets - previousMetrics.retweets;
        const repliesDelta = currentMetrics.replies - previousMetrics.replies;
        const quotesDelta = currentMetrics.quotes - previousMetrics.quotes;
        const impressionsDelta = currentMetrics.impressions - previousMetrics.impressions;
        const prevTotalEngagement = previousMetrics.likes + previousMetrics.retweets + previousMetrics.replies + previousMetrics.quotes;
        
        await Metrics.create({
          postId: post._id,
          creatorId: post.creatorId,
          projectId: post.projectId,
          organizationId: ORGANIZATION_ID,
          metrics: {
            ...currentMetrics,
            totalEngagement,
            engagementRate: parseFloat(engagementRate.toFixed(2)),
          },
          growth: {
            likesDelta,
            retweetsDelta,
            repliesDelta,
            quotesDelta,
            impressionsDelta,
            engagementDelta: totalEngagement - prevTotalEngagement,
            likesGrowthPercent: previousMetrics.likes > 0 ? parseFloat(((likesDelta / previousMetrics.likes) * 100).toFixed(2)) : 0,
            retweetsGrowthPercent: previousMetrics.retweets > 0 ? parseFloat(((retweetsDelta / previousMetrics.retweets) * 100).toFixed(2)) : 0,
            impressionsGrowthPercent: previousMetrics.impressions > 0 ? parseFloat(((impressionsDelta / previousMetrics.impressions) * 100).toFixed(2)) : 0,
            hoursSinceLastUpdate: 168, // 7 days
          },
          source: Math.random() > 0.5 ? 'reminder' : 'manual',
          submittedBy: post.creatorId,
          recordedAt: updateDate,
        });
        
        previousMetrics = currentMetrics;
        totalMetricsCreated++;
        updateIndex++;
      }
    }
    console.log(`✅ Created ${totalMetricsCreated} metrics records (with daily updates for first 15 days)\n`);

    // ============================================
    // 6. CREATE NOTIFICATIONS
    // ============================================
    console.log('🔔 Creating notifications...');
    const notifications = [];

    // Create notifications for admin
    const notificationTypes = [
      {
        type: 'post_submitted',
        title: 'New Post Submitted',
        getMessage: (creator: any) => `${creator.name} submitted a new post for review`,
        priority: 'normal',
      },
      {
        type: 'metrics_updated',
        title: 'Metrics Updated',
        getMessage: (creator: any) => `${creator.name} updated metrics for their recent post`,
        priority: 'low',
      },
      {
        type: 'milestone_reached',
        title: 'Milestone Reached! 🎉',
        getMessage: (creator: any) => `${creator.name}'s post reached 10K impressions`,
        priority: 'high',
      },
      {
        type: 'creator_joined',
        title: 'New Creator Joined',
        getMessage: (creator: any) => `${creator.name} accepted their invitation and joined the platform`,
        priority: 'normal',
      },
    ];

    for (let i = 0; i < 20; i++) {
      const creator = activeCreators[Math.floor(Math.random() * activeCreators.length)];
      const notifType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const isRead = Math.random() > 0.3; // 70% read
      
      const notification = await Notification.create({
        recipientId: admin._id,
        senderId: creator._id,
        organizationId: ORGANIZATION_ID,
        type: notifType.type,
        priority: notifType.priority,
        title: notifType.title,
        message: notifType.getMessage(creator),
        actionText: 'View Details',
        actionUrl: `/admin/posts`,
        relatedEntity: {
          type: 'post',
          id: posts[Math.floor(Math.random() * posts.length)]._id,
        },
        metadata: {
          creatorId: creator._id,
          projectId: creator.creatorProfile?.projectId,
        },
        status: isRead ? 'read' : 'unread',
        readAt: isRead ? daysAgo(Math.floor(Math.random() * 7)) : undefined,
        emailDelivery: {
          shouldSend: false,
          sent: false,
        },
        createdAt: daysAgo(Math.floor(Math.random() * 14)),
      });
      
      notifications.push(notification);
    }
    console.log(`✅ Created ${notifications.length} notifications\n`);

    // ============================================
    // 7. CREATE ACTIVITY LOGS
    // ============================================
    console.log('📜 Creating activity logs...');
    let totalActivityLogs = 0;

    const activityActions = [
      { action: 'post_approved', description: (creator: any) => `Approved post from ${creator.name}`, entityType: 'post' },
      { action: 'post_rejected', description: (creator: any) => `Rejected post from ${creator.name}`, entityType: 'post' },
      { action: 'creator_invited', description: (creator: any) => `Invited ${creator.name} to join project`, entityType: 'user' },
      { action: 'project_created', description: (project: any) => `Created new project: ${project.name}`, entityType: 'project' },
      { action: 'metrics_updated', description: (creator: any) => `${creator.name} updated post metrics`, entityType: 'metrics' },
      { action: 'organization_settings_changed', description: () => 'Updated organization settings', entityType: 'organization' },
    ];

    for (let i = 0; i < 50; i++) {
      const actionInfo = activityActions[Math.floor(Math.random() * activityActions.length)];
      const isAdminAction = Math.random() > 0.4;
      const actor = isAdminAction ? admin : activeCreators[Math.floor(Math.random() * activeCreators.length)];
      
      let entityId: any;
      if (actionInfo.entityType === 'post') {
        entityId = posts[Math.floor(Math.random() * posts.length)]._id;
      } else if (actionInfo.entityType === 'user') {
        entityId = activeCreators[Math.floor(Math.random() * activeCreators.length)]._id;
      } else if (actionInfo.entityType === 'project') {
        entityId = projects[Math.floor(Math.random() * projects.length)]._id;
      } else if (actionInfo.entityType === 'organization') {
        entityId = organization._id;
      } else {
        entityId = new mongoose.Types.ObjectId();
      }
      
      const log = await ActivityLog.create({
        userId: actor._id,
        userEmail: actor.email,
        userName: actor.name,
        userRole: actor.role === 'admin' ? 'admin' : 'creator',
        organizationId: ORGANIZATION_ID,
        organizationName: organization.name,
        projectId: isAdminAction ? undefined : actor.creatorProfile?.projectId,
        projectName: isAdminAction ? undefined : projects.find(p => p._id.equals(actor.creatorProfile?.projectId))?.name,
        action: actionInfo.action as any,
        entityType: actionInfo.entityType as any,
        entityId,
        entityName: actionInfo.entityType === 'post' ? 'Twitter Post' : undefined,
        description: actionInfo.description(actor),
        metadata: {
          source: 'web',
          success: true,
          duration: Math.floor(Math.random() * 500) + 100,
        },
        request: {
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          browser: 'Chrome',
          os: 'macOS',
          device: 'desktop',
        },
        tags: ['user-action', actionInfo.entityType],
        severity: 'info',
        retentionPeriod: 90,
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      });
      
      totalActivityLogs++;
    }
    console.log(`✅ Created ${totalActivityLogs} activity logs\n`);

    // ============================================
    // 8. UPDATE STATS
    // ============================================
    console.log('📈 Updating aggregated stats...');

    // Update creator stats
    for (const creator of creators) {
      const creatorPosts = posts.filter(p => p.creatorId.equals(creator._id));
      const approvedPosts = creatorPosts.filter(p => p.status === 'approved');
      const pendingPosts = creatorPosts.filter(p => p.status === 'pending');
      
      const totalLikes = approvedPosts.reduce((sum, p) => sum + p.latestMetrics.likes, 0);
      const totalRetweets = approvedPosts.reduce((sum, p) => sum + p.latestMetrics.retweets, 0);
      const totalImpressions = approvedPosts.reduce((sum, p) => sum + p.latestMetrics.impressions, 0);
      const avgEngagementRate = approvedPosts.length > 0
        ? approvedPosts.reduce((sum, p) => sum + p.latestMetrics.engagementRate, 0) / approvedPosts.length
        : 0;
      
      if (creator.creatorProfile) {
        creator.creatorProfile.stats = {
          totalPosts: creatorPosts.length,
          approvedPosts: approvedPosts.length,
          pendingPosts: pendingPosts.length,
          totalLikes,
          totalRetweets,
          totalImpressions,
          avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
          lastPostDate: creatorPosts.length > 0 ? creatorPosts[0].createdAt : undefined,
          lastMetricUpdate: new Date(),
        };
        await creator.save();
      }
    }

    // Update project stats
    for (const project of projects) {
      const projectPosts = posts.filter(p => p.projectId.equals(project._id));
      const projectCreators = creators.filter(c => c.creatorProfile?.projectId?.equals(project._id));
      const activeProjectCreators = projectCreators.filter(c => c.creatorProfile?.status === 'active');
      
      const approvedPosts = projectPosts.filter(p => p.status === 'approved');
      const pendingPosts = projectPosts.filter(p => p.status === 'pending');
      
      const totalEngagement = approvedPosts.reduce((sum, p) => 
        sum + p.latestMetrics.likes + p.latestMetrics.retweets + p.latestMetrics.replies, 0
      );
      const totalImpressions = approvedPosts.reduce((sum, p) => sum + p.latestMetrics.impressions, 0);
      const avgEngagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions * 100) : 0;
      
      project.stats = {
        totalCreators: projectCreators.length,
        activeCreators: activeProjectCreators.length,
        totalPosts: projectPosts.length,
        approvedPosts: approvedPosts.length,
        pendingPosts: pendingPosts.length,
        totalEngagement,
        totalImpressions,
        avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
        lastUpdated: new Date(),
      };
      await project.save();
    }

    // Update organization usage
    organization.usage = {
      projectsCount: projects.length,
      creatorsCount: creators.length,
      postsThisMonth: posts.filter(p => p.createdAt > daysAgo(30)).length,
      lastResetDate: new Date(),
    };
    await organization.save();

    console.log('✅ Updated all stats\n');

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log(`\n📊 Summary:`);
    console.log(`  • Organization: ${organization.name}`);
    console.log(`  • Admin User: ${admin.name} (${admin.email})`);
    console.log(`  • Projects: ${projects.length}`);
    console.log(`  • Creators: ${creators.length} (${activeCreators.length} active)`);
    console.log(`  • Posts: ${posts.length}`);
    console.log(`  • Metrics History: ${totalMetricsCreated} records`);
    console.log(`  • Notifications: ${notifications.length}`);
    console.log(`  • Activity Logs: ${totalActivityLogs}`);
    console.log(`  • Invitations: ${invitations.length}`);
    console.log(`\n✨ Your dashboard should now be fully populated with realistic data!`);
    console.log(`\n🔗 Login at: http://localhost:3000/login`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Dashboard: http://localhost:3000/${organization.slug}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding
seedData();

