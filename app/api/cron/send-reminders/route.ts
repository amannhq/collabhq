import { NextRequest, NextResponse } from 'next/server';
import { runSendRemindersJob } from '@/jobs/sendReminders';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('api-cron-send-reminders');
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

async function handleRequest(request: NextRequest) {
  if (!isAuthorized(request)) {
    logger.warn({ path: request.nextUrl.pathname }, 'Unauthorized cron call');
    return unauthorizedResponse();
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const dryRunParam = searchParams.get('dryRun') ?? searchParams.get('dry_run');

    const limit = limitParam ? Number(limitParam) : undefined;
    if (limit !== undefined && (Number.isNaN(limit) || limit <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Invalid limit parameter' },
        { status: 400 }
      );
    }

    const dryRun = dryRunParam === 'true' || dryRunParam === '1';

    const result = await runSendRemindersJob({
      limit,
      dryRun,
    });

    return NextResponse.json(
      { success: true, data: result },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    logger.error({ error }, 'Failed to execute reminder cron');
    return NextResponse.json(
      { success: false, error: 'Failed to execute reminder cron' },
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

