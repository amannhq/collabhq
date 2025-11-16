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

// Connection options
const options: mongoose.ConnectOptions = {
  bufferCommands: false, // Disable mongoose buffering
  maxPoolSize: 10, // Maximum number of sockets the MongoDB driver will keep open
  minPoolSize: 5, // Minimum number of sockets
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
  family: 4, // Use IPv4, skip trying IPv6
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
 * Connect to MongoDB
 * Uses cached connection in development to prevent multiple connections
 */
async function connectDB(): Promise<typeof mongoose> {
  // If we have a cached connection, return it
  if (cached.conn) {
    logger.debug({}, 'Using cached MongoDB connection');
    return mongoose;
  }

  // If we don't have a promise, create one
  if (!cached.promise) {
    logger.info({}, 'Creating new MongoDB connection...');
    
    cached.promise = mongoose
      .connect(MONGODB_URI!, options)
      .then((mongooseInstance) => {
        logger.info({
          database: mongooseInstance.connection.db?.databaseName,
          host: mongooseInstance.connection.host,
        }, 'MongoDB connected successfully');
        return mongooseInstance.connection;
      })
      .catch((error) => {
        logger.error({ error }, 'MongoDB connection error');
        cached.promise = null; // Reset promise on error
        throw error;
      });
  }

  try {
    // Wait for the connection to be established
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return mongoose;
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
 * Get current connection status
 */
function getConnectionStatus(): {
  isConnected: boolean;
  readyState: number;
  host?: string;
  name?: string;
} {
  const connection = mongoose.connection;
  
  return {
    isConnected: connection.readyState === 1,
    readyState: connection.readyState,
    host: connection.host,
    name: connection.name,
  };
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

// Event listeners for connection monitoring
mongoose.connection.on('connected', () => {
  logger.info({}, 'Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error({ error: err }, 'Mongoose connection error');
});

mongoose.connection.on('disconnected', () => {
  logger.info({}, 'Mongoose disconnected from MongoDB');
});

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info({}, 'Mongoose connection closed due to app termination');
    process.exit(0);
  });
}

export default connectDB;
export { disconnectDB, getConnectionStatus, ConnectionState };