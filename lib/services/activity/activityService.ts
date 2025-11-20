import { FilterQuery, Types } from 'mongoose';
import ActivityLog from '@/lib/db/models/ActivityLog';
import type { IActivityLog } from '@/lib/db/models/ActivityLog';
import type {
  ActivityFilters,
  ActivityLogListPayload,
  ActivityLogResponseDto,
} from '@/types/activity';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('activity-service');

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MAX_EXPORT_ROWS = 2000;

type ExtendedFilters = ActivityFilters & {
  search?: string;
  actor?: string;
  userRole?: 'admin' | 'creator';
  success?: boolean;
};

interface ListParams {
  organizationId: string;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  filters?: ExtendedFilters;
}

interface ExportParams extends Omit<ListParams, 'page'> {
  exportLimit?: number;
}

type LeanActivityLog = Omit<
  IActivityLog,
  | 'organizationId'
  | 'userId'
  | 'projectId'
  | 'entityId'
  | '_id'
> & {
  _id: Types.ObjectId | string;
  organizationId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  projectId?: Types.ObjectId | string;
  entityId: Types.ObjectId | string;
  createdAt: Date;
};

const toObjectId = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  try {
    return new Types.ObjectId(value);
  } catch {
    return undefined;
  }
};

const toStringId = (value?: Types.ObjectId | string) => {
  if (!value) {
    return undefined;
  }

  return typeof value === 'string' ? value : value.toString();
};

const sanitizeActivityLog = (log: LeanActivityLog): ActivityLogResponseDto => ({
  _id: toStringId(log._id)!,
  userId: toStringId(log.userId)!,
  userEmail: log.userEmail,
  userName: log.userName,
  userRole: log.userRole,
  organizationId: toStringId(log.organizationId)!,
  organizationName: log.organizationName,
  projectId: toStringId(log.projectId),
  projectName: log.projectName,
  action: log.action as ActivityLogResponseDto['action'],
  entityType: log.entityType,
  entityId: toStringId(log.entityId)!,
  entityName: log.entityName,
  description: log.description,
  changes: log.changes || [],
  metadata: {
    source: log.metadata?.source,
    method: log.metadata?.method,
    endpoint: log.metadata?.endpoint,
    duration: log.metadata?.duration,
    success: log.metadata?.success ?? true,
    errorMessage: log.metadata?.errorMessage,
    bulkOperation: log.metadata?.bulkOperation,
  },
  request: log.request,
  tags: log.tags || [],
  severity: log.severity as ActivityLogResponseDto['severity'],
  retentionPeriod: log.retentionPeriod,
  expiresAt: log.expiresAt,
  createdAt: log.createdAt?.toISOString() ?? new Date().toISOString(),
});

const buildActivityQuery = ({
  organizationId,
  filters,
}: {
  organizationId: string;
  filters?: ExtendedFilters;
}): FilterQuery<IActivityLog> => {
  const orgObjectId = toObjectId(organizationId);

  if (!orgObjectId) {
    throw new Error('Invalid organizationId supplied to activity service');
  }

  const conditions: FilterQuery<IActivityLog>[] = [
    {
      organizationId: orgObjectId,
    },
  ];

  if (!filters) {
    return conditions[0];
  }

  if (filters.userId) {
    const userObjectId = toObjectId(filters.userId as string);
    if (userObjectId) {
      conditions.push({ userId: userObjectId });
    }
  }

  if (filters.projectId) {
    const projectObjectId = toObjectId(filters.projectId as string);
    if (projectObjectId) {
      conditions.push({ projectId: projectObjectId });
    }
  }

  if (filters.action) {
    conditions.push({ action: filters.action });
  }

  if (filters.entityType) {
    conditions.push({ entityType: filters.entityType });
  }

  if (filters.severity) {
    conditions.push({ severity: filters.severity });
  }

  if (filters.userRole) {
    conditions.push({ userRole: filters.userRole });
  }

  if (typeof filters.success === 'boolean') {
    conditions.push({ 'metadata.success': filters.success });
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push({ tags: { $in: filters.tags } });
  }

  if (filters.dateRange?.start || filters.dateRange?.end) {
    const range: Record<string, Date> = {};

    if (filters.dateRange.start) {
      range.$gte = filters.dateRange.start;
    }

    if (filters.dateRange.end) {
      range.$lte = filters.dateRange.end;
    }

    conditions.push({ createdAt: range });
  }

  if (filters.actor) {
    conditions.push({
      $or: [
        { userName: { $regex: filters.actor, $options: 'i' } },
        { userEmail: { $regex: filters.actor, $options: 'i' } },
      ],
    });
  }

  if (filters.search) {
    const regex = { $regex: filters.search, $options: 'i' };
    conditions.push({
      $or: [
        { description: regex },
        { entityName: regex },
        { action: regex },
        { tags: { $elemMatch: regex } },
      ],
    });
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { $and: conditions };
};

export async function getActivityLogs({
  organizationId,
  page = 1,
  limit = DEFAULT_LIMIT,
  sortOrder = 'desc',
  filters,
}: ListParams): Promise<ActivityLogListPayload> {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const query = buildActivityQuery({ organizationId, filters });

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean<LeanActivityLog[]>(),
    ActivityLog.countDocuments(query),
  ]);

  const totalPages = Math.max(Math.ceil(total / safeLimit), 1);

  return {
    logs: logs.map(sanitizeActivityLog),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export async function exportActivityLogs({
  organizationId,
  filters,
  sortOrder = 'desc',
  exportLimit,
}: ExportParams): Promise<ActivityLogResponseDto[]> {
  const safeLimit = Math.min(
    Math.max(exportLimit ?? MAX_LIMIT, 1),
    MAX_EXPORT_ROWS,
  );

  const query = buildActivityQuery({ organizationId, filters });

  const logs = await ActivityLog.find(query)
    .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
    .limit(safeLimit)
    .lean<LeanActivityLog[]>();

  logger.info(
    {
      organizationId,
      count: logs.length,
      limit: safeLimit,
    },
    'Exported activity logs',
  );

  return logs.map(sanitizeActivityLog);
}

