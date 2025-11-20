import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { getSession, getUser, hasOrganizationAccess } from '@/lib/auth';
import { createRealtimeStream } from '@/lib/realtime/sse';
import { createLogger } from '@/lib/utils/logger';
import type { Session } from '@/lib/auth';
import type { RealtimeResource } from '@/types/realtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const logger = createLogger('realtime-sse-route');

const parseResources = (value: string | null): RealtimeResource[] | undefined => {
  if (!value) {
    return undefined;
  }

  const allowed: RealtimeResource[] = ['posts', 'metrics', 'notifications'];
  const parsed = value
    .split(',')
    .map((resource) => resource.trim())
    .filter((resource): resource is RealtimeResource =>
      allowed.includes(resource as RealtimeResource)
    );

  return parsed.length > 0 ? parsed : undefined;
};

const resolveOrganizationId = async (
  session: Session,
  requestedOrgId?: string | null
): Promise<string | null> => {
  let organizationId = session.user.organizationId ?? null;

  if (!organizationId) {
    const userRecord = await getUser(session.user.id);

    if (userRecord?.organizationId) {
      organizationId =
        typeof userRecord.organizationId === 'string'
          ? userRecord.organizationId
          : userRecord.organizationId.toString();
    } else if (userRecord?.creatorProfile?.projectId) {
      const { default: Project } = await import('@/lib/db/models/Project');
      const project = await Project.findById(userRecord.creatorProfile.projectId)
        .select('organizationId')
        .lean<{ organizationId?: { toString(): string } }>();

      organizationId = project?.organizationId?.toString() ?? null;
    }
  }

  if (requestedOrgId) {
    if (requestedOrgId === organizationId) {
      return requestedOrgId;
    }

    const hasAccess = await hasOrganizationAccess(session.user.id, requestedOrgId);

    if (!hasAccess) {
      const error = new Error('FORBIDDEN_ORGANIZATION');
      error.name = 'ForbiddenError';
      throw error;
    }

    organizationId = requestedOrgId;
  }

  return organizationId;
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const requestedOrgId = searchParams.get('organizationId');
    const resources = parseResources(searchParams.get('resources'));

    const organizationId = await resolveOrganizationId(session, requestedOrgId);

    if (!organizationId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Organization context required for realtime stream',
        }),
        { status: 400 }
      );
    }

    const { stream, close } = await createRealtimeStream({
      organizationId,
      userId: session.user.id,
      role: (session.user.role as 'admin' | 'creator' | 'saas-admin') ?? 'admin',
      resources,
    });

    request.signal.addEventListener('abort', () => {
      close();
    });

    logger.debug(
      {
        organizationId,
        userId: session.user.id,
        resources: resources ?? 'all',
      },
      'Realtime SSE connection established'
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ForbiddenError') {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden' }),
        { status: 403 }
      );
    }

    logger.error({ error }, 'Failed to establish realtime SSE connection');

    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

