import { initializeRealtimeChangeStreams, subscribeToRealtimeChanges } from '@/lib/realtime/changeStreams';
import { createLogger } from '@/lib/utils/logger';
import type { RealtimeMessage, RealtimeResource } from '@/types/realtime';

type ConnectionRole = 'admin' | 'creator' | 'saas-admin';

interface RealtimeStreamOptions {
  organizationId: string;
  userId: string;
  role?: ConnectionRole;
  resources?: RealtimeResource[];
}

interface RealtimeStreamResult {
  stream: ReadableStream<Uint8Array>;
  close: () => void;
}

const HEARTBEAT_INTERVAL = 15000;
const DEFAULT_RESOURCES: RealtimeResource[] = ['posts', 'metrics', 'notifications'];

const logger = createLogger('realtime-sse');
const encoder = new TextEncoder();

const shouldDeliverEvent = (
  event: RealtimeMessage,
  options: RealtimeStreamOptions,
  allowedResources: Set<RealtimeResource>
) => {
  if (!allowedResources.has(event.resource)) {
    return false;
  }

  if (event.organizationId !== options.organizationId) {
    return false;
  }

  const effectiveRole = options.role ?? 'admin';

  if (event.resource === 'notifications') {
    return event.context?.recipientId === options.userId;
  }

  // Admins & SaaS admins receive all org events
  if (effectiveRole === 'admin' || effectiveRole === 'saas-admin') {
    return true;
  }

  // Creators only receive events connected to their userId
  if (effectiveRole === 'creator') {
    return event.context?.creatorId === options.userId;
  }

  return false;
};

const writeEvent = (
  controller: ReadableStreamDefaultController<Uint8Array>,
  eventName: string,
  payload: unknown
) => {
  controller.enqueue(
    encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`)
  );
};

export async function createRealtimeStream(
  options: RealtimeStreamOptions
): Promise<RealtimeStreamResult> {
  const allowedResources = new Set(
    options.resources?.length ? options.resources : DEFAULT_RESOURCES
  );

  let keepAliveTimer: NodeJS.Timeout | null = null;
  let unsubscribe: (() => void) | null = null;
  let closed = false;

  const cleanup = () => {
    if (closed) {
      return;
    }

    closed = true;

    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Always send connected event, even if change streams fail
      writeEvent(controller, 'connected', {
        timestamp: new Date().toISOString(),
        changeStreamsEnabled: false, // Will be updated if successful
      });

      // Start heartbeat immediately to keep connection alive
      keepAliveTimer = setInterval(() => {
        if (!closed) {
          try {
            writeEvent(controller, 'heartbeat', {
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            logger.debug({ error }, 'Heartbeat failed, connection likely closed');
            cleanup();
          }
        }
      }, HEARTBEAT_INTERVAL);

      // Try to initialize change streams, but don't fail the connection if it doesn't work
      try {
        await initializeRealtimeChangeStreams();

        // Subscribe to changes if initialization succeeded
        unsubscribe = subscribeToRealtimeChanges((event: RealtimeMessage) => {
          if (!shouldDeliverEvent(event, options, allowedResources)) {
            return;
          }

          try {
            writeEvent(controller, event.resource, event);
          } catch (error) {
            logger.debug({ error }, 'Failed to write event, connection likely closed');
          }
        });

        // Notify client that change streams are active
        writeEvent(controller, 'status', {
          changeStreamsEnabled: true,
          timestamp: new Date().toISOString(),
        });

        logger.debug({}, 'Change streams enabled for SSE connection');
      } catch (error) {
        // Log the error but keep the connection alive
        logger.warn(
          { error },
          'Change streams unavailable - SSE connection will remain open without realtime updates'
        );

        // Notify client that change streams are not available
        writeEvent(controller, 'status', {
          changeStreamsEnabled: false,
          reason: 'Change streams not supported (standalone MongoDB)',
          timestamp: new Date().toISOString(),
        });
      }
    },
    cancel() {
      cleanup();
    },
  });

  return {
    stream,
    close: cleanup,
  };
}

