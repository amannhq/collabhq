#!/usr/bin/env tsx
/**
 * Seed Script: Initialize Default Email Templates
 * 
 * This script creates default email templates for all organizations
 * that don't already have them. It creates three templates:
 * - invitation: For inviting creators to projects
 * - welcome: For welcoming new creators
 * - reminder: For reminding creators about pending posts
 * 
 * Usage: bun run scripts/seed-email-templates.ts
 */

import connectDB from '../lib/db/mongodb';
import { Organization, EmailTemplate } from '../lib/db/models';
import { createLogger } from '../lib/utils/logger';

const logger = createLogger('seed-email-templates');

const DEFAULT_TEMPLATES = [
  {
    slug: 'invitation',
    category: 'transactional' as const,
    name: 'Creator Invitation',
    subject: "You're invited to join {{projectName}} at {{organizationName}}",
    previewText: 'Accept your invitation to start contributing',
    content: {
      heading: "You've Been Invited! 🎉",
      body: `<p>Hi {{name}},</p>
<p>You've been invited to join <strong>{{projectName}}</strong> at {{organizationName}}.</p>
<p>As a creator, you'll be able to submit posts, track your performance, and collaborate with the team.</p>
<p>Click the button below to accept your invitation and get started:</p>`,
      ctaText: 'Accept Invitation',
      ctaUrl: '{{inviteUrl}}',
      footerText: "If you didn't expect this invitation, you can safely ignore this email.",
    },
    variables: ['name', 'email', 'organizationName', 'projectName', 'inviteUrl'],
    isActive: true,
    isDefault: true,
  },
  {
    slug: 'welcome',
    category: 'transactional' as const,
    name: 'Welcome Email',
    subject: 'Welcome to {{organizationName}}! 🚀',
    previewText: "You're all set! Let's get started",
    content: {
      heading: 'Welcome Aboard! 🎊',
      body: `<p>Hi {{name}},</p>
<p>Welcome to {{organizationName}}! We're thrilled to have you on our team.</p>
<p>Your creator account has been successfully activated. You can now:</p>
<ul>
  <li>Submit posts for review</li>
  <li>Track your performance metrics</li>
  <li>View your earnings and analytics</li>
  <li>Collaborate with the team</li>
</ul>
<p>Click the button below to access your dashboard and get started:</p>`,
      ctaText: 'Go to Dashboard',
      ctaUrl: '{{dashboardUrl}}',
      footerText: 'Need help getting started? Feel free to reach out to your team admin.',
    },
    variables: ['name', 'email', 'organizationName', 'dashboardUrl'],
    isActive: true,
    isDefault: true,
  },
  {
    slug: 'reminder',
    category: 'notification' as const,
    name: 'Post Submission Reminder',
    subject: 'Reminder: Pending posts at {{organizationName}}',
    previewText: "Don't forget to submit your posts",
    content: {
      heading: 'Friendly Reminder 📝',
      body: `<p>Hi {{name}},</p>
<p>This is a friendly reminder that you have pending posts waiting for submission at {{organizationName}}.</p>
<p>Your contributions are important to us, and we'd love to see your latest work!</p>
<p>Click the button below to log in to your dashboard and submit your posts:</p>`,
      ctaText: 'Submit Posts',
      ctaUrl: '{{dashboardUrl}}',
      footerText: 'You can adjust your notification preferences in your account settings.',
    },
    variables: ['name', 'email', 'organizationName', 'dashboardUrl'],
    isActive: true,
    isDefault: true,
  },
];

async function seedEmailTemplates() {
  try {
    logger.info({}, 'Starting email templates seeding...');

    // Connect to database
    await connectDB();
    logger.info({}, 'Connected to database');

    // Get all organizations
    const organizations = await Organization.find({}).select('_id name settings');
    logger.info({ count: organizations.length }, 'Found organizations');

    let totalCreated = 0;
    let totalSkipped = 0;

    // Create templates for each organization
    for (const org of organizations) {
      logger.info({ orgId: org._id, orgName: org.name }, 'Processing organization');

      for (const template of DEFAULT_TEMPLATES) {
        // Check if template already exists
        const existing = await EmailTemplate.findOne({
          organizationId: org._id,
          slug: template.slug,
        });

        if (existing) {
          logger.info(
            { orgId: org._id, slug: template.slug },
            'Template already exists, skipping'
          );
          totalSkipped++;
          continue;
        }

        // Create template with organization branding
        const newTemplate = new EmailTemplate({
          organizationId: org._id,
          ...template,
          branding: {
            primaryColor: org.settings?.primaryColor || '#667eea',
            secondaryColor: org.settings?.secondaryColor || '#764ba2',
            logoUrl: org.settings?.logo || undefined,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
        });

        await newTemplate.save();
        logger.info(
          { orgId: org._id, slug: template.slug, templateId: newTemplate._id },
          'Created template'
        );
        totalCreated++;
      }
    }

    logger.info(
      {
        totalOrganizations: organizations.length,
        totalCreated,
        totalSkipped,
      },
      'Seeding completed successfully'
    );

    console.log('\n✅ Email Templates Seeding Complete!');
    console.log(`   Organizations: ${organizations.length}`);
    console.log(`   Templates Created: ${totalCreated}`);
    console.log(`   Templates Skipped: ${totalSkipped}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Failed to seed email templates');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedEmailTemplates();
