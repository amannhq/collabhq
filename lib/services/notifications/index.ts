import Notification from '@/lib/db/models/Notification';
import type { CreateNotificationDto } from '@/types/notification';
import mongoose from 'mongoose';

/**
 * Helper function to create notifications
 */
export async function createNotification(data: CreateNotificationDto) {
  const notification = await Notification.create({
    recipientId: data.recipientId,
    senderId: data.senderId,
    organizationId: data.organizationId,
    type: data.type,
    priority: data.priority || 'normal',
    title: data.title,
    message: data.message,
    actionText: data.actionText,
    actionUrl: data.actionUrl,
    relatedEntity: data.relatedEntity,
    metadata: data.metadata || {},
    emailDelivery: data.shouldSendEmail
      ? {
          shouldSend: true,
          sent: false,
        }
      : undefined,
  });

  return notification;
}

/**
 * Helper to create bulk notifications
 */
export async function createBulkNotifications(
  recipientIds: string[],
  data: Omit<CreateNotificationDto, 'recipientId'>
) {
  const notifications = recipientIds.map((recipientId) => ({
    recipientId: new mongoose.Types.ObjectId(recipientId),
    senderId: data.senderId,
    organizationId: data.organizationId,
    type: data.type,
    priority: data.priority || 'normal',
    title: data.title,
    message: data.message,
    actionText: data.actionText,
    actionUrl: data.actionUrl,
    relatedEntity: data.relatedEntity,
    metadata: data.metadata || {},
    emailDelivery: data.shouldSendEmail
      ? {
          shouldSend: true,
          sent: false,
        }
      : undefined,
  }));

  return await Notification.insertMany(notifications);
}

/**
 * Notification templates for common scenarios
 */
export const notificationTemplates = {
  postSubmitted: (creatorName: string, postUrl: string, orgSlug: string, postId: string) => ({
    type: 'post_submitted' as const,
    priority: 'normal' as const,
    title: 'New Post Submitted',
    message: `${creatorName} has submitted a new post for review.`,
    actionText: 'Review Post',
    actionUrl: `/${orgSlug}/posts/${postId}`,
  }),

  postApproved: (orgSlug: string, postId: string) => ({
    type: 'post_approved' as const,
    priority: 'normal' as const,
    title: 'Post Approved',
    message: 'Your post has been approved and is now live!',
    actionText: 'View Post',
    actionUrl: `/${orgSlug}/posts/${postId}`,
  }),

  postRejected: (reason: string) => ({
    type: 'post_rejected' as const,
    priority: 'high' as const,
    title: 'Post Rejected',
    message: `Your post was rejected. Reason: ${reason}`,
    actionText: 'View Details',
    actionUrl: undefined,
  }),

  metricsReminder: (orgSlug: string) => ({
    type: 'metrics_reminder' as const,
    priority: 'normal' as const,
    title: 'Metrics Update Reminder',
    message: "Don't forget to update your post metrics this week!",
    actionText: 'Update Metrics',
    actionUrl: `/${orgSlug}/posts`,
  }),

  metricsUpdated: (creatorName: string, postTitle: string, orgSlug: string, postId: string) => ({
    type: 'metrics_updated' as const,
    priority: 'low' as const,
    title: 'Metrics Updated',
    message: `${creatorName} updated metrics for "${postTitle}"`,
    actionText: 'View Metrics',
    actionUrl: `/${orgSlug}/posts/${postId}`,
  }),

  milestoneReached: (milestone: string, value: number) => ({
    type: 'milestone_reached' as const,
    priority: 'high' as const,
    title: '🎉 Milestone Reached!',
    message: `Congratulations! You've reached ${value.toLocaleString()} ${milestone}!`,
    actionText: 'View Analytics',
    actionUrl: undefined,
  }),

  creatorInvited: (orgName: string, inviteToken: string) => ({
    type: 'creator_invited' as const,
    priority: 'high' as const,
    title: 'Creator Invitation',
    message: `You've been invited to join ${orgName} as a creator!`,
    actionText: 'Accept Invitation',
    actionUrl: `/invite/${inviteToken}`,
  }),

  creatorJoined: (creatorName: string, orgSlug: string) => ({
    type: 'creator_joined' as const,
    priority: 'normal' as const,
    title: 'New Creator Joined',
    message: `${creatorName} has accepted your invitation and joined the team!`,
    actionText: 'View Creator',
    actionUrl: `/${orgSlug}/creators`,
  }),

  projectCreated: (projectName: string, orgSlug: string, projectId: string) => ({
    type: 'project_created' as const,
    priority: 'low' as const,
    title: 'New Project Created',
    message: `A new project "${projectName}" has been created.`,
    actionText: 'View Project',
    actionUrl: `/${orgSlug}/projects/${projectId}`,
  }),

  weeklyReport: (orgSlug: string) => ({
    type: 'weekly_report' as const,
    priority: 'normal' as const,
    title: 'Weekly Performance Report',
    message: 'Your weekly performance report is ready to view.',
    actionText: 'View Report',
    actionUrl: `/${orgSlug}/analytics`,
  }),

  systemAlert: (message: string) => ({
    type: 'system_alert' as const,
    priority: 'urgent' as const,
    title: 'System Alert',
    message,
    actionText: undefined,
    actionUrl: undefined,
  }),
};
