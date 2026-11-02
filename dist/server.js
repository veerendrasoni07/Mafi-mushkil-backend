"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const database_1 = require("./config/database");
const seed_1 = require("./database/seed");
const env_1 = require("./config/env");
async function bootstrap() {
    try {
        console.log('[Server] Connecting to database...');
        await (0, database_1.connectDatabase)();
        console.log('[Server] Seeding initial data...');
        await (0, seed_1.seedDatabase)();
        const app = (0, app_1.createApp)();
        const server = app.listen(env_1.config.port, () => {
            console.log(`=======================================================`);
            console.log(`🚀 Mafi Mushkil API Server listening on port ${env_1.config.port}`);
            console.log(`📡 Health Check: http://localhost:${env_1.config.port}/health`);
            console.log(`🌐 Base API:     http://localhost:${env_1.config.port}/api/v1`);
            console.log(`=======================================================`);
        });
        // Graceful Shutdown
        const handleShutdown = async (signal) => {
            console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                await (0, database_1.disconnectDatabase)();
                console.log('[Server] Closed all connections. Exiting process.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
        process.on('SIGINT', () => handleShutdown('SIGINT'));
    }
    catch (err) {
        console.error('[Server] Fatal startup error:', err);
        process.exit(1);
    }
}
bootstrap();
