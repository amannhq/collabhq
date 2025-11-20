import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { getSession, hasOrganizationAccess } from '@/lib/auth';
import {
  exportActivityLogs,
  getActivityLogs,
} from '@/lib/services/activity/activityService';
import { createLogger } from '@/lib/utils/logger';
import { ActivityAction, Severity } from '@/types';

const logger = createLogger('activity-api');

const escapeCsv = (value: unknown) => {
  if (value === null || typeof value === 'undefined') {
    return '""';
  }

  const serialized = String(value).replace(/"/g, '""');
  return `"${serialized}"`;
};

const buildCsv = (rows: Awaited<ReturnType<typeof exportActivityLogs>>) => {
  const header = [
    'Timestamp',
    'Actor',
    'Actor Email',
    'Role',
    'Action',
    'Entity Type',
    'Entity Name',
    'Project',
    'Description',
    'Severity',
    'Outcome',
    'Tags',
  ].map(escapeCsv);

  const body = rows.map((log) =>
    [
      new Date(log.createdAt).toISOString(),
      log.userName,
      log.userEmail,
      log.userRole,
      log.action,
      log.entityType,
      log.entityName ?? '',
      log.projectName ?? '',
      log.description,
      log.severity,
      log.metadata?.success ? 'Success' : 'Failed',
      (log.tags || []).join('|'),
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [header.join(','), ...body].join('\n');
};

const parseTags = (input: string | null) => {
  if (!input) {
    return undefined;
  }

  const tags = input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return tags.length > 0 ? tags : undefined;
};

const parseStatus = (value: string | null) => {
  if (!value) {
    return undefined;
  }

  if (value === 'success') {
    return true;
  }

  if (value === 'error' || value === 'failed') {
    return false;
  }

  return undefined;
};

const normalizeDate = (value: string | null) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
};

const parseActivityAction = (value: string | null): ActivityAction | undefined => {
  if (!value) {
    return undefined;
  }

  // Check if the value is a valid ActivityAction enum value
  if (Object.values(ActivityAction).includes(value as ActivityAction)) {
    return value as ActivityAction;
  }

  return undefined;
};

const parseSeverity = (value: string | null): Severity | undefined => {
  if (!value) {
    return undefined;
  }

  // Check if the value is a valid Severity enum value
  if (Object.values(Severity).includes(value as Severity)) {
    return value as Severity;
  }

  return undefined;
};

export async function GET(request: NextRequest) {
  const startedAt = Date.now();

  try {
    await connectDB();

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { searchParams } = request.nextUrl;
    const organizationId =
      searchParams.get('orgId') ??
      searchParams.get('organizationId') ??
      session.user.organizationId ??
      undefined;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 },
      );
    }

    const allowed =
      session.user.role === 'saas-admin'
        ? true
        : await hasOrganizationAccess(session.user.id, organizationId);

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 },
      );
    }

    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '25', 10);
    const sortOrder = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';
    const exportFormat = searchParams.get('format');
    const exportLimit = Number.parseInt(
      searchParams.get('exportLimit') || '500',
      10,
    );

    const startDate = normalizeDate(searchParams.get('startDate'));
    const endDate = normalizeDate(searchParams.get('endDate'));

    const filters = {
      userId: searchParams.get('userId') ?? undefined,
      projectId: searchParams.get('projectId') ?? undefined,
      action: parseActivityAction(searchParams.get('action')),
      entityType: searchParams.get('entityType') ?? undefined,
      severity: parseSeverity(searchParams.get('severity')),
      tags: parseTags(searchParams.get('tags')),
      search: searchParams.get('search') ?? undefined,
      actor: searchParams.get('actor') ?? undefined,
      userRole:
        searchParams.get('role') === 'admin' ||
        searchParams.get('role') === 'creator'
          ? (searchParams.get('role') as 'admin' | 'creator')
          : undefined,
      success: parseStatus(searchParams.get('status')),
      dateRange:
        startDate || endDate
          ? {
              start: startDate,
              end: endDate,
            }
          : undefined,
    };

    if (exportFormat === 'csv') {
      const exportRows = await exportActivityLogs({
        organizationId,
        filters,
        sortOrder,
        exportLimit,
      });

      const csv = buildCsv(exportRows);
      const now = new Date().toISOString().split('T')[0];

      logger.info(
        {
          organizationId,
          filters,
          exportedRows: exportRows.length,
          duration: Date.now() - startedAt,
        },
        'Activity logs CSV exported',
      );

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="activity-logs-${now}.csv"`,
        },
      });
    }

    const data = await getActivityLogs({
      organizationId,
      page,
      limit,
      sortOrder,
      filters,
    });

    logger.info(
      {
        organizationId,
        filters,
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        duration: Date.now() - startedAt,
      },
      'Activity logs fetched',
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error(
      {
        error,
        endpoint: '/api/activity',
      },
      'Failed to fetch activity logs',
    );

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

