import mongoose, { type AnyBulkWriteOperation } from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { Post } from '@/lib/db/models';
import type { IPost } from '@/lib/db/models/Post';
import type { IUser } from '@/lib/db/models/User';
import type { IOrganization } from '@/lib/db/models/Organization';
import type { IProject } from '@/lib/db/models/Project';
import { createLogger } from '@/lib/utils/logger';
import { sendMetricsReminderEmail } from '@/lib/services/email/email-service';
import { createNotification } from '@/lib/services/notifications';
import { NotificationPriority, NotificationType } from '@/types';

const logger = createLogger('job-send-reminders');

type PopulatedPost = Omit<IPost, 'creatorId' | 'organizationId' | 'projectId'> & {
  creatorId: IUser;
  organizationId: IOrganization;
  projectId: IProject;
};

type ReminderGroup = {
  creatorId: string;
  creatorEmail: string;
  creatorName: string;
  organizationId: string;
  organizationName: string;
  organizationSlug?: string;
  dashboardUrl: string;
  posts: Array<{
    postId: mongoose.Types.ObjectId;
    projectName?: string;
    postUrl: string;
    lastMetricsUpdate?: Date;
    reminderFrequencyHours: number;
  }>;
};

type SkipCounters = {
  missingCreator: number;
  missingEmail: number;
  notificationsDisabled: number;
  remindersDisabled: number;
};

export interface SendRemindersJobOptions {
  limit?: number;
  dryRun?: boolean;
}

export interface SendRemindersJobResult {
  runAt: string;
  dryRun: boolean;
  totalEligiblePosts: number;
  creatorsTargeted: number;
  remindersSent: number;
  postsQueued: number;
  postsUpdated: number;
  skipped: SkipCounters;
  durationMs: number;
}

const HOURS_IN_MS = 60 * 60 * 1000;
const ENV_BATCH_LIMIT = Number(process.env.REMINDER_JOB_BATCH_SIZE);
const DEFAULT_BATCH_LIMIT =
  Number.isFinite(ENV_BATCH_LIMIT) && ENV_BATCH_LIMIT > 0 ? ENV_BATCH_LIMIT : 100;
const ENV_STALE_HOURS = Number(process.env.METRICS_REMINDER_STALE_HOURS);
const DEFAULT_STALE_HOURS =
  Number.isFinite(ENV_STALE_HOURS) && ENV_STALE_HOURS > 0 ? ENV_STALE_HOURS : 24;
const ENV_REMINDER_FREQUENCY = Number(process.env.DEFAULT_REMINDER_FREQUENCY_HOURS);
const DEFAULT_REMINDER_FREQUENCY_HOURS =
  Number.isFinite(ENV_REMINDER_FREQUENCY) && ENV_REMINDER_FREQUENCY > 0
    ? ENV_REMINDER_FREQUENCY
    : 24;

const getFrequencyHours = ({
  post,
  project,
  creator,
}: {
  post: PopulatedPost;
  project?: IProject;
  creator: IUser;
}) => {
  return (
    post.reminders?.reminderFrequency ||
    project?.settings?.metricUpdateFrequency ||
    creator.preferences?.reminderFrequency ||
    DEFAULT_REMINDER_FREQUENCY_HOURS
  );
};

export async function runSendRemindersJob(
  options: SendRemindersJobOptions = {}
): Promise<SendRemindersJobResult> {
  const start = Date.now();
  const dryRun = options.dryRun ?? false;
  const batchLimit = options.limit ?? DEFAULT_BATCH_LIMIT;
  const staleHours = DEFAULT_STALE_HOURS;

  await connectDB();

  const now = new Date();
  const staleCutoff = new Date(now.getTime() - staleHours * HOURS_IN_MS);
  const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const posts = await Post.find({
    status: 'approved',
    'latestMetrics.lastUpdatedAt': { $lte: staleCutoff },
    $or: [
      { 'reminders.nextDue': { $exists: false } },
      { 'reminders.nextDue': { $lte: now } },
    ],
  })
    .sort({ 'reminders.nextDue': 1, 'latestMetrics.lastUpdatedAt': 1 })
    .limit(batchLimit)
    .populate([
      {
        path: 'creatorId',
        select: 'email name preferences role',
      },
      {
        path: 'organizationId',
        select: 'name slug',
      },
      {
        path: 'projectId',
        select: 'name settings',
      },
    ])
    .lean<PopulatedPost[]>();

  const skipped: SkipCounters = {
    missingCreator: 0,
    missingEmail: 0,
    notificationsDisabled: 0,
    remindersDisabled: 0,
  };

  const groups = new Map<string, ReminderGroup>();

  for (const post of posts) {
    const creator = post.creatorId as unknown as IUser | undefined;
    const project = post.projectId as unknown as IProject | undefined;
    const organization = post.organizationId as unknown as IOrganization | undefined;

    if (!creator || creator.role !== 'creator' || !organization) {
      skipped.missingCreator += 1;
      continue;
    }

    if (!creator.email) {
      skipped.missingEmail += 1;
      continue;
    }

    if (creator.preferences?.emailNotifications === false) {
      skipped.notificationsDisabled += 1;
      continue;
    }

    if (project?.settings?.autoReminders === false) {
      skipped.remindersDisabled += 1;
      continue;
    }

    const creatorId = creator._id.toString();
    const frequencyHours = getFrequencyHours({ post, project, creator });

    let group = groups.get(creatorId);
    if (!group) {
      group = {
        creatorId,
        creatorEmail: creator.email,
        creatorName: creator.name,
        organizationId: organization._id.toString(),
        organizationName: organization.name,
        organizationSlug: organization.slug,
        dashboardUrl: `${baseAppUrl}/creator/${creatorId}/posts`,
        posts: [],
      };
      groups.set(creatorId, group);
    }

    group.posts.push({
      postId: post._id as mongoose.Types.ObjectId,
      projectName: project?.name,
      postUrl: post.postUrl,
      lastMetricsUpdate: post.latestMetrics?.lastUpdatedAt || post.updatedAt,
      reminderFrequencyHours: frequencyHours,
    });

    groups.set(creatorId, group);
  }

  const postUpdates: AnyBulkWriteOperation<IPost>[] = [];
  let remindersSent = 0;
  let postsQueued = 0;

  for (const group of groups.values()) {
    postsQueued += group.posts.length;

    if (!dryRun) {
      await sendMetricsReminderEmail({
        email: group.creatorEmail,
        name: group.creatorName,
        organizationId: group.organizationId,
        organizationName: group.organizationName,
        dashboardUrl: group.dashboardUrl,
        posts: group.posts.map((post) => ({
          projectName: post.projectName,
          postUrl: post.postUrl,
          lastMetricsUpdate: post.lastMetricsUpdate,
        })),
      });

      await createNotification({
        recipientId: group.creatorId,
        organizationId: group.organizationId,
        type: NotificationType.METRICS_REMINDER,
        priority: NotificationPriority.NORMAL,
        title: 'Metrics Update Reminder',
        message: `You have ${group.posts.length} post${
          group.posts.length > 1 ? 's' : ''
        } waiting for new metrics.`,
        actionText: 'Update Metrics',
        actionUrl: `/creator/${group.creatorId}/posts`,
        relatedEntity: {
          type: 'creator',
          id: group.creatorId,
        },
        metadata: {
          postIds: group.posts.map((post) => post.postId.toString()),
          reminderJobRunAt: now.toISOString(),
        },
      });

      remindersSent += 1;
    }

    for (const post of group.posts) {
      const nextDue = new Date(now.getTime() + post.reminderFrequencyHours * HOURS_IN_MS);
      postUpdates.push({
        updateOne: {
          filter: { _id: post.postId },
          update: {
            $set: {
              'reminders.lastSent': now,
              'reminders.nextDue': nextDue,
              'reminders.reminderFrequency': post.reminderFrequencyHours,
            },
            ...(dryRun
              ? {}
              : {
                  $inc: {
                    'reminders.sentCount': 1,
                  },
                }),
          },
        },
      });
    }
  }

  if (!dryRun && postUpdates.length) {
    await Post.bulkWrite(postUpdates);
  }

  const durationMs = Date.now() - start;

  const result: SendRemindersJobResult = {
    runAt: now.toISOString(),
    dryRun,
    totalEligiblePosts: posts.length,
    creatorsTargeted: groups.size,
    remindersSent,
    postsQueued,
    postsUpdated: dryRun ? 0 : postsQueued,
    skipped,
    durationMs,
  };

  logger.info(
    {
      ...result,
      skipped,
    },
    'Metrics reminder job completed'
  );

  return result;
}

