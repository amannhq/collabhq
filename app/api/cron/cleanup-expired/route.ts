import { NextRequest, NextResponse } from 'next/server';
import { runCleanupJob } from '@/jobs/cleanupExpired';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('api-cron-cleanup');
const CRON_SECRET = process.env.CRON_SECRET;

const unauthorizedResponse = () =>
  NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } }
  );

const isAuthorized = (request: NextRequest) => {
  if (!CRON_SECRET) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  const xCronHeader = request.headers.get('x-cron-secret');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader?.trim();
  const queryToken = request.nextUrl.searchParams.get('cron_secret');

  return [bearerToken, xCronHeader?.trim(), queryToken?.trim()].includes(CRON_SECRET);
};

const parsePositiveNumber = (value: string | null, field: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${field} parameter`);
  }

  return parsed;
};

async function handleRequest(request: NextRequest) {
  if (!isAuthorized(request)) {
    logger.warn({ path: request.nextUrl.pathname }, 'Unauthorized cron call');
    return unauthorizedResponse();
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const dryRunParam = searchParams.get('dryRun') ?? searchParams.get('dry_run');

    let metricsBatchSize: number | undefined;
    let invitationRetentionDays: number | undefined;
    let metricsRetentionDays: number | undefined;
    let activityRetentionDays: number | undefined;

    try {
      metricsBatchSize = parsePositiveNumber(
        searchParams.get('metricsBatchSize') ?? searchParams.get('metrics_batch_size'),
        'metricsBatchSize'
      );
      invitationRetentionDays = parsePositiveNumber(
        searchParams.get('invitationRetentionDays') ??
          searchParams.get('invitation_retention_days'),
        'invitationRetentionDays'
      );
      metricsRetentionDays = parsePositiveNumber(
        searchParams.get('metricsRetentionDays') ?? searchParams.get('metrics_retention_days'),
        'metricsRetentionDays'
      );
      activityRetentionDays = parsePositiveNumber(
        searchParams.get('activityRetentionDays') ??
          searchParams.get('activity_retention_days'),
        'activityRetentionDays'
      );
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: parseError instanceof Error ? parseError.message : 'Invalid parameter' },
        { status: 400 }
      );
    }

    const dryRun = dryRunParam === 'true' || dryRunParam === '1';

    const result = await runCleanupJob({
      dryRun,
      metricsBatchSize,
      invitationRetentionDays,
      metricsRetentionDays,
      activityRetentionDays,
    });

    return NextResponse.json(
      { success: true, data: result },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    logger.error({ error }, 'Failed to execute cleanup cron');
    return NextResponse.json(
      { success: false, error: 'Failed to execute cleanup cron' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

