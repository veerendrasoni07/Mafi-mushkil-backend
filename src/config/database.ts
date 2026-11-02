import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<void> {
  let uri = config.mongoUri;

  if (!uri) {
    if (config.nodeEnv === 'production') {
      throw new Error('[Database] MONGODB_URI environment variable is required in production mode.');
    }
    console.log('[Database] No MONGODB_URI provided. Initializing in-memory MongoDB server...');
    mongoMemoryServer = await MongoMemoryServer.create();
    uri = mongoMemoryServer.getUri();
    console.log(`[Database] In-memory MongoDB running at: ${uri}`);
  }

  try {
    await mongoose.connect(uri);
    console.log('[Database] MongoDB connected successfully.');
  } catch (err) {
    if (config.nodeEnv === 'production') {
      console.error('[Database] Failed to connect to MongoDB in production:', err);
      throw err;
    }
    console.warn('[Database] Failed to connect to provided MONGODB_URI. Falling back to in-memory MongoDB...', err);
    if (!mongoMemoryServer) {
      mongoMemoryServer = await MongoMemoryServer.create();
      uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`[Database] In-memory MongoDB running at: ${uri}`);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
