import mongoose, { mongo } from 'mongoose';
import { ensureDbConnection } from '@/lib/db/mongodb';
import { createLogger } from '@/lib/utils/logger';
import type {
  RealtimeMessage,
  RealtimeResource,
  RealtimeAction,
} from '@/types/realtime';

type ChangeHandler = (event: RealtimeMessage) => void;
type ChangeDoc = Record<string, unknown>;
type MongoStream = mongo.ChangeStream<ChangeDoc>;
type MongoChangeEvent = mongo.ChangeStreamDocument<ChangeDoc>;

type WatchedCollection = RealtimeResource;

const WATCHED_COLLECTIONS: WatchedCollection[] = [
  'posts',
  'metrics',
  'notifications',
];

const logger = createLogger('realtime-change-streams');

const OPERATION_TO_ACTION: Partial<
  Record<mongo.ChangeStreamDocument<ChangeDoc>['operationType'], RealtimeAction>
> = {
  insert: 'created',
  replace: 'updated',
  update: 'updated',
  delete: 'deleted',
};

const streamOptions = {
  fullDocument: 'updateLookup' as const,
  maxAwaitTimeMS: 1000,
};

// Retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const REPLICA_SET_ERROR_MESSAGE = 'only supported on replica sets';

const toStringId = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === 'object' && 'toString' in value) {
    return (value as { toString(): string }).toString();
  }

  return undefined;
};

const toISODate = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return new Date(value).toISOString();
  }

  return undefined;
};

const mapOperationToAction = (
  operationType: mongo.ChangeStreamDocument<ChangeDoc>['operationType']
): RealtimeAction | null => {
  return OPERATION_TO_ACTION[operationType] ?? null;
};

type MongoChangeWithDocument =
  | mongo.ChangeStreamInsertDocument<ChangeDoc>
  | mongo.ChangeStreamUpdateDocument<ChangeDoc>
  | mongo.ChangeStreamReplaceDocument<ChangeDoc>;

const hasFullDocument = (
  change: MongoChangeEvent
): change is MongoChangeWithDocument => {
  return 'fullDocument' in change && Boolean(change.fullDocument);
};

class ChangeStreamManager {
  private streams = new Map<WatchedCollection, MongoStream>();
  private handlers = new Set<ChangeHandler>();
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private retryAttempts = new Map<WatchedCollection, number>();
  private retryTimeouts = new Map<WatchedCollection, NodeJS.Timeout>();
  private changeStreamsSupported = true; // Assume true until proven false
  private disabledCollections = new Set<WatchedCollection>();

  subscribe(handler: ChangeHandler): () => void {
    this.handlers.add(handler);

    return () => {
      this.handlers.delete(handler);
    };
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.setupStreams().finally(() => {
      this.initPromise = null;
    });

    return this.initPromise;
  }

  async shutdown(): Promise<void> {
    // Clear all retry timeouts
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();
    this.retryAttempts.clear();

    for (const collection of WATCHED_COLLECTIONS) {
      await this.closeStream(collection);
    }
    this.initialized = false;
  }

  private async setupStreams(): Promise<void> {
    await ensureDbConnection();

    const connection = mongoose.connection;

    if (connection.readyState !== 1) {
      throw new Error('MongoDB connection is not ready for change streams');
    }

    const results = await Promise.allSettled(
      WATCHED_COLLECTIONS.map((collection) => this.createStream(collection))
    );

    // Check if any streams were successfully created
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    
    if (successCount === 0 && !this.changeStreamsSupported) {
      logger.warn(
        {},
        'Change streams not supported (standalone MongoDB). Realtime features disabled in development.'
      );
    } else if (successCount > 0) {
      logger.info(
        { 
          collections: WATCHED_COLLECTIONS.filter(c => !this.disabledCollections.has(c)),
          disabled: Array.from(this.disabledCollections)
        },
        'Realtime change streams initialized'
      );
    }

    this.initialized = true;
  }

  private async createStream(collection: WatchedCollection) {
    // Skip if collection is disabled
    if (this.disabledCollections.has(collection)) {
      return;
    }

    const connection = mongoose.connection;
    const mongoCollection = connection.collection(collection);

    try {
      const stream = mongoCollection.watch([], streamOptions) as MongoStream;
      this.streams.set(collection, stream);

      // Reset retry attempts on successful creation
      this.retryAttempts.set(collection, 0);

      stream.on('change', (change) => {
        this.handleChange(collection, change);
      });

      stream.on('error', (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if this is a replica set error
        if (errorMessage.includes(REPLICA_SET_ERROR_MESSAGE)) {
          this.changeStreamsSupported = false;
          this.disabledCollections.add(collection);
          logger.warn(
            { collection },
            'Change streams require replica set - disabling for this collection'
          );
          return;
        }

        logger.error(
          { collection, error: errorMessage },
          'Change stream error encountered'
        );
        this.restartStream(collection);
      });

      stream.on('end', () => {
        logger.warn({ collection }, 'Change stream ended');
        this.restartStream(collection);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if this is a replica set error
      if (errorMessage.includes(REPLICA_SET_ERROR_MESSAGE)) {
        this.changeStreamsSupported = false;
        this.disabledCollections.add(collection);
        logger.warn(
          { collection },
          'Change streams require replica set - disabling for this collection'
        );
        return;
      }

      throw error;
    }
  }

  private async restartStream(collection: WatchedCollection) {
    // Clear any existing retry timeout
    const existingTimeout = this.retryTimeouts.get(collection);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    await this.closeStream(collection);

    // Check if collection is disabled
    if (this.disabledCollections.has(collection)) {
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      logger.warn(
        { collection, state: mongoose.connection.readyState },
        'MongoDB not connected during change stream restart'
      );
      this.initialized = false;
      return;
    }

    // Get current retry attempt count
    const attempts = this.retryAttempts.get(collection) ?? 0;

    if (attempts >= MAX_RETRY_ATTEMPTS) {
      logger.error(
        { collection, attempts },
        'Max retry attempts reached - disabling change stream for this collection'
      );
      this.disabledCollections.add(collection);
      return;
    }

    // Calculate exponential backoff delay
    const delay = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, attempts),
      MAX_RETRY_DELAY
    );

    logger.info(
      { collection, attempt: attempts + 1, delayMs: delay },
      'Scheduling change stream restart'
    );

    // Increment retry attempts
    this.retryAttempts.set(collection, attempts + 1);

    // Schedule restart with exponential backoff
    const timeout = setTimeout(async () => {
      this.retryTimeouts.delete(collection);
      
      try {
        await this.createStream(collection);
        logger.info({ collection }, 'Change stream restarted successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(
          { collection, error: errorMessage },
          'Failed to restart change stream'
        );
        
        // Check if it's a replica set error
        if (errorMessage.includes(REPLICA_SET_ERROR_MESSAGE)) {
          this.changeStreamsSupported = false;
          this.disabledCollections.add(collection);
        }
      }
    }, delay);

    this.retryTimeouts.set(collection, timeout);
  }

  private async closeStream(collection: WatchedCollection) {
    const stream = this.streams.get(collection);

    if (!stream) {
      return;
    }

    try {
      stream.removeAllListeners();
      await stream.close();
    } catch (error) {
      logger.error({ collection, error }, 'Failed to close change stream');
    } finally {
      this.streams.delete(collection);
    }
  }

  private handleChange(
    collection: WatchedCollection,
    change: MongoChangeEvent
  ) {
    const message = this.transformChangeToMessage(collection, change);

    if (!message) {
      return;
    }

    for (const handler of this.handlers) {
      try {
        handler(message);
      } catch (error) {
        logger.error(
          { error, resource: message.resource },
          'Realtime handler threw error'
        );
      }
    }
  }

  private transformChangeToMessage(
    collection: WatchedCollection,
    change: MongoChangeEvent
  ): RealtimeMessage | null {
    const action = mapOperationToAction(change.operationType);

    if (!action || action === 'deleted') {
      // Delete events are skipped until we can reliably fetch their organization context
      return null;
    }

    if (!hasFullDocument(change)) {
      return null;
    }

    const documentId = toStringId(change.documentKey?._id);
    if (!documentId) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const fullDocument = change.fullDocument as Record<string, unknown>;

    const organizationId = toStringId(fullDocument.organizationId);
    if (!organizationId) {
      return null;
    }

    const baseMessage = {
      id: `${collection}:${documentId}:${Date.now()}`,
      resource: collection,
      action,
      documentId,
      organizationId,
      timestamp,
    } satisfies Omit<RealtimeMessage, 'payload'>;

    switch (collection) {
      case 'posts': {
        const projectId = toStringId(fullDocument.projectId);
        const creatorId = toStringId(fullDocument.creatorId);
        const latestMetrics = fullDocument.latestMetrics as { likes?: number; retweets?: number; replies?: number; impressions?: number; engagementRate?: number; lastUpdatedAt?: unknown } | undefined;

        return {
          ...baseMessage,
          payload: {
            status: fullDocument.status,
            latestMetrics: latestMetrics
              ? {
                  likes: latestMetrics.likes ?? 0,
                  retweets: latestMetrics.retweets ?? 0,
                  replies: latestMetrics.replies ?? 0,
                  impressions: latestMetrics.impressions ?? 0,
                  engagementRate:
                    latestMetrics.engagementRate ?? 0,
                  lastUpdatedAt: toISODate(
                    latestMetrics.lastUpdatedAt
                  ),
                }
              : undefined,
            growth: fullDocument.growth,
          },
          context: {
            projectId,
            creatorId,
          },
        };
      }

      case 'metrics': {
        const postId = toStringId(fullDocument.postId);
        const projectId = toStringId(fullDocument.projectId);
        const creatorId = toStringId(fullDocument.creatorId);

        return {
          ...baseMessage,
          payload: {
            metrics: fullDocument.metrics,
            growth: fullDocument.growth,
            recordedAt: toISODate(fullDocument.recordedAt),
          },
          context: {
            postId,
            projectId,
            creatorId,
          },
        };
      }

      case 'notifications': {
        const recipientId = toStringId(fullDocument.recipientId);

        return {
          ...baseMessage,
          payload: {
            type: fullDocument.type,
            priority: fullDocument.priority,
            title: fullDocument.title,
            message: fullDocument.message,
            status: fullDocument.status,
            createdAt: toISODate(fullDocument.createdAt),
          },
          context: {
            recipientId,
          },
        };
      }

      default:
        return null;
    }
  }
}

const changeStreamManager = new ChangeStreamManager();

export async function initializeRealtimeChangeStreams(): Promise<void> {
  await changeStreamManager.init();
}

export function subscribeToRealtimeChanges(handler: ChangeHandler): () => void {
  return changeStreamManager.subscribe(handler);
}

export async function shutdownRealtimeChangeStreams(): Promise<void> {
  await changeStreamManager.shutdown();
}

