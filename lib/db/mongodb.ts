// src/lib/db/mongodb.ts
import mongoose from 'mongoose';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('mongodb');

// Extend global type to include mongoose cache
declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

// MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Connection options optimized for serverless (Vercel)
const options: mongoose.ConnectOptions = {
  // Connection Pool Settings - Optimized for Serverless
  maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 5, // Reduced for serverless (was 10)
  minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE) || 1, // Minimal pool (was 2)
  maxIdleTimeMS: 30000, // Close idle faster in serverless (was 60s)
  
  // Timeout Settings - Aggressive for faster failures
  serverSelectionTimeoutMS: 5000, // Fail faster in serverless (was 10s)
  socketTimeoutMS: 30000, // Shorter timeout for serverless (was 45s)
  connectTimeoutMS: 5000, // Quick connection timeout (was 10s)
  
  // Performance Settings
  bufferCommands: false, // Disable mongoose buffering for immediate errors
  maxConnecting: 1, // Single connection attempt in serverless (was 2)
  
  // Network Settings
  family: 4, // Use IPv4, skip trying IPv6 (faster DNS resolution)
  
  // Retry Settings
  retryWrites: true, // Automatically retry failed writes
  retryReads: true, // Automatically retry failed reads
  
  // Write Concern (optimized for speed)
  w: 1, // Only wait for primary acknowledgment (faster than 'majority')
  wtimeoutMS: 2500, // Shorter write timeout (was 5s)
  
  // Compression for faster data transfer
  compressors: ['zlib'],
};

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with optimized connection handling
 * Uses cached connection to prevent multiple connections in serverless environments
 */
async function connectDB(): Promise<typeof mongoose> {
  // If we have a cached connection and it's active, return it
  if (cached.conn) {
    const state = mongoose.connection.readyState;
    
    // 1 = connected, reuse it
    if (state === 1) {
      logger.debug({ env: process.env.NODE_ENV }, 'Using cached MongoDB connection');
      return mongoose;
    }
    
    // 2 = connecting, wait for it
    if (state === 2) {
      logger.debug({}, 'MongoDB connection in progress, waiting...');
      if (cached.promise) {
        await cached.promise;
        return mongoose;
      }
    }
    
    // 0 or 3 = disconnected/disconnecting, reconnect
    logger.warn({ state }, 'Cached connection invalid, reconnecting...');
    cached.conn = null;
    cached.promise = null;
  }

  // If we don't have a promise, create one
  if (!cached.promise) {
    logger.info({ env: process.env.NODE_ENV }, 'Creating new MongoDB connection...');
    
    cached.promise = mongoose
      .connect(MONGODB_URI!, options)
      .then((mongooseInstance) => {
        const conn = mongooseInstance.connection;
        logger.info({
          database: conn.db?.databaseName,
          host: conn.host,
          poolSize: options.maxPoolSize,
          env: process.env.NODE_ENV,
        }, 'MongoDB connected successfully');
        return conn;
      })
      .catch((error) => {
        logger.error({ 
          error: error.message,
          code: error.code,
          env: process.env.NODE_ENV,
        }, 'MongoDB connection error');
        // Reset both on error to force reconnection on next attempt
        cached.conn = null;
        cached.promise = null;
        throw error;
      });
  }

  try {
    // Wait for the connection to be established
    cached.conn = await cached.promise;
  } catch (error) {
    // Ensure we reset on any error
    cached.conn = null;
    cached.promise = null;
    throw error;
  }

  return mongoose;
}

/**
 * Ensure we have an active MongoDB connection without duplicating logic
 */
async function ensureDbConnection(): Promise<typeof mongoose> {
  const state = mongoose.connection.readyState;

  if (state === ConnectionState.CONNECTED) {
    return mongoose;
  }

  if (state === ConnectionState.CONNECTING && cached?.promise) {
    await cached.promise;
    return mongoose;
  }

  return connectDB();
}

/**
 * Disconnect from MongoDB
 * Useful for cleanup in serverless environments
 */
async function disconnectDB(): Promise<void> {
  if (!cached.conn) {
    return;
  }

  try {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    logger.info({}, 'MongoDB disconnected');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting from MongoDB');
    throw error;
  }
}

/**
 * Get current connection status with detailed metrics
 */
function getConnectionStatus(): {
  isConnected: boolean;
  readyState: number;
  readyStateText: string;
  host?: string;
  name?: string;
  poolSize?: number;
  activeConnections?: number;
} {
  const connection = mongoose.connection;
  
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };
  
  return {
    isConnected: connection.readyState === 1,
    readyState: connection.readyState,
    readyStateText: stateMap[connection.readyState] || 'unknown',
    host: connection.host,
    name: connection.name,
    poolSize: options.maxPoolSize,
    activeConnections: (connection as any).client?.topology?.s?.pool?.totalConnectionCount,
  };
}

/**
 * Health check function for monitoring
 */
async function healthCheck(): Promise<{
  healthy: boolean;
  status: ReturnType<typeof getConnectionStatus>;
  latency?: number;
  error?: string;
}> {
  const status = getConnectionStatus();
  
  if (!status.isConnected) {
    return {
      healthy: false,
      status,
      error: 'Database not connected',
    };
  }
  
  try {
    const startTime = Date.now();
    await mongoose.connection.db?.admin().ping();
    const latency = Date.now() - startTime;
    
    return {
      healthy: true,
      status,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      status,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Connection state enum for reference
 * 0 = disconnected
 * 1 = connected
 * 2 = connecting
 * 3 = disconnecting
 */
const ConnectionState = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3,
} as const;

// Increase max listeners to prevent warnings in development with hot reloading
mongoose.connection.setMaxListeners(20);

// Track if listeners have been registered to prevent duplicates
let listenersRegistered = false;

// Event listeners for connection monitoring (register only once)
if (!listenersRegistered) {
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    const conn = mongoose.connection;
    logger.info({
      host: conn.host,
      port: conn.port,
      name: conn.name,
    }, 'Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ 
      error: err.message,
      code: err.code,
      name: err.name,
    }, 'Mongoose connection error');
    
    // Reset cache on error to allow reconnection
    if (cached) {
      cached.conn = null;
      cached.promise = null;
    }
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn({}, 'Mongoose disconnected from MongoDB');
    
    // Reset cache on disconnect
    if (cached) {
      cached.conn = null;
      cached.promise = null;
    }
  });

  mongoose.connection.on('reconnected', () => {
    logger.info({}, 'Mongoose reconnected to MongoDB');
  });

  mongoose.connection.on('close', () => {
    logger.info({}, 'Mongoose connection closed');
  });

  // Monitor connection pool events (useful for debugging)
  if (process.env.NODE_ENV === 'development') {
    mongoose.connection.on('fullsetup', () => {
      logger.debug({}, 'MongoDB connection pool ready');
    });
  }
}

// Graceful shutdown for all environments
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, closing MongoDB connection...');
  
  try {
    await mongoose.connection.close();
    cached.conn = null;
    cached.promise = null;
    logger.info({}, 'Mongoose connection closed due to app termination');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during graceful shutdown');
    process.exit(1);
  }
};

// Handle different termination signals
if (process.env.NODE_ENV !== 'development') {
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
}

export default connectDB;
export {
  disconnectDB,
  getConnectionStatus,
  healthCheck,
  ConnectionState,
  ensureDbConnection,
};