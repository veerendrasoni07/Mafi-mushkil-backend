import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { seedDatabase } from './database/seed';
import { config } from './config/env';

async function bootstrap() {
  try {
    console.log('[Server] Connecting to database...');
    await connectDatabase();

    console.log('[Server] Seeding initial data...');
    await seedDatabase();

    const app = createApp();
    const server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Mafi Mushkil API Server listening on port ${config.port}`);
      console.log(`📡 Health Check: http://localhost:${config.port}/health`);
      console.log(`🌐 Base API:     http://localhost:${config.port}/api/v1`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown
    const handleShutdown = async (signal: string) => {
      console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('[Server] Closed all connections. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

bootstrap();
