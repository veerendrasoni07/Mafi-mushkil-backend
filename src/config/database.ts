
import mongoose from 'mongoose';
import { config } from './env';

export async function connectDatabase(): Promise<void> {
  const uri = config.mongoUri;

  if (!uri) {
    throw new Error(
      '[Database] MONGODB_URI environment variable is required.'
    );
  }

  try {
    await mongoose.connect(uri);
    console.log('[Database] MongoDB connected successfully.');
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('[Database] MongoDB disconnected.');
}
