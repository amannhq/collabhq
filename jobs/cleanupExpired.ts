import mongoose from 'mongoose';
import type { Document as MongoDocument } from 'mongodb';
import connectDB from '@/lib/db/mongodb';
import { Invitation, Metrics, ActivityLog } from '@/lib/db/models';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('job-cleanup-expired');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface CleanupJobOptions {
  dryRun?: boolean;
  invitationRetentionDays?: number;
  metricsRetentionDays?: number;
  activityRetentionDays?: number;
  metricsBatchSize?: number;
}

export interface CleanupJobResult {
  runAt: string;
  dryRun: boolean;
  expiredMarked: number;
  deletedInvitations: number;
  metricsArchived: number;
  metricsDeleted: number;
  activityLogsDeleted: number;
  durationMs: number;
}

const resolveNumber = (value: number | undefined, fallback: number) => {
  return Number.isFinite(value) && value && value > 0 ? value : fallback;
};

export async function runCleanupJob(
  options: CleanupJobOptions = {}
): Promise<CleanupJobResult> {
  const start = Date.now();
  const dryRun = options.dryRun ?? false;
  const envInvitationRetention = Number(process.env.INVITATION_RETENTION_DAYS);
  const envMetricsRetention = Number(process.env.METRICS_RETENTION_DAYS);
  const envActivityRetention = Number(process.env.ACTIVITY_LOG_RETENTION_DAYS);
  const envMetricsBatchSize = Number(process.env.METRICS_ARCHIVE_BATCH_SIZE);

  const invitationRetentionDays = options.invitationRetentionDays ?? resolveNumber(envInvitationRetention, 30);
  const metricsRetentionDays = options.metricsRetentionDays ?? resolveNumber(envMetricsRetention, 90);
  const activityRetentionDays = options.activityRetentionDays ?? resolveNumber(envActivityRetention, 90);
  const metricsBatchSize = options.metricsBatchSize ?? resolveNumber(envMetricsBatchSize, 500);

  await connectDB();

  const now = new Date();
  const invitationCutoff = new Date(now.getTime() - invitationRetentionDays * DAY_IN_MS);
  const metricsCutoff = new Date(now.getTime() - metricsRetentionDays * DAY_IN_MS);
  const activityCutoff = new Date(now.getTime() - activityRetentionDays * DAY_IN_MS);

  let expiredMarked = 0;
  const pendingExpiredFilter = {
    status: 'pending' as const,
    expiresAt: { $lt: now },
  };

  if (dryRun) {
    expiredMarked = await Invitation.countDocuments(pendingExpiredFilter);
  } else {
    const markResult = await Invitation.updateMany(pendingExpiredFilter, {
      $set: { status: 'expired' as const },
    });
    expiredMarked = markResult.modifiedCount ?? 0;
  }

  const invitationDeleteFilter = {
    status: { $in: ['expired', 'cancelled'] },
    expiresAt: { $lt: invitationCutoff },
  };

  let deletedInvitations = 0;
  if (dryRun) {
    deletedInvitations = await Invitation.countDocuments(invitationDeleteFilter);
  } else {
    const deleteResult = await Invitation.deleteMany(invitationDeleteFilter);
    deletedInvitations = deleteResult.deletedCount ?? 0;
  }

  const metricsDocs = await Metrics.find({
    recordedAt: { $lt: metricsCutoff },
  })
    .sort({ recordedAt: 1 })
    .limit(metricsBatchSize);

  const metricsArchived = metricsDocs.length;
  let metricsDeleted = 0;

  if (!dryRun && metricsDocs.length) {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection not initialized');
    }
    const archiveCollection = db.collection<MongoDocument>('metrics_archive');
    const archivePayload: MongoDocument[] = metricsDocs.map((doc) => ({
      ...doc.toObject(),
      archivedAt: new Date(),
      originalId: doc._id,
    }));
    await archiveCollection.insertMany(archivePayload);

    const metricIds = metricsDocs.map((doc) => doc._id);
    const deleteResult = await Metrics.deleteMany({
      _id: { $in: metricIds },
    });
    metricsDeleted = deleteResult.deletedCount ?? 0;
  } else if (dryRun) {
    metricsDeleted = metricsArchived;
  }

  const activityFilter = {
    createdAt: { $lt: activityCutoff },
    severity: { $ne: 'critical' as const },
  };

  let activityLogsDeleted = 0;
  if (dryRun) {
    activityLogsDeleted = await ActivityLog.countDocuments(activityFilter);
  } else {
    const deleteResult = await ActivityLog.deleteMany(activityFilter);
    activityLogsDeleted = deleteResult.deletedCount ?? 0;
  }

  const durationMs = Date.now() - start;

  const result: CleanupJobResult = {
    runAt: now.toISOString(),
    dryRun,
    expiredMarked,
    deletedInvitations,
    metricsArchived,
    metricsDeleted,
    activityLogsDeleted,
    durationMs,
  };

  logger.info({ result }, 'Cleanup job completed');

  return result;
}

