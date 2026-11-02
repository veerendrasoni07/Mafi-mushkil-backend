"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const env_1 = require("./env");
let mongoMemoryServer = null;
async function connectDatabase() {
    let uri = env_1.config.mongoUri;
    if (!uri) {
        console.log('[Database] No MONGODB_URI provided. Initializing in-memory MongoDB server...');
        mongoMemoryServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        uri = mongoMemoryServer.getUri();
        console.log(`[Database] In-memory MongoDB running at: ${uri}`);
    }
    try {
        await mongoose_1.default.connect(uri);
        console.log('[Database] MongoDB connected successfully.');
    }
    catch (err) {
        console.warn('[Database] Failed to connect to provided MONGODB_URI. Falling back to in-memory MongoDB...', err);
        if (!mongoMemoryServer) {
            mongoMemoryServer = await mongodb_memory_server_1.MongoMemoryServer.create();
            uri = mongoMemoryServer.getUri();
            await mongoose_1.default.connect(uri);
            console.log(`[Database] In-memory MongoDB running at: ${uri}`);
        }
    }
}
async function disconnectDatabase() {
    await mongoose_1.default.disconnect();
    if (mongoMemoryServer) {
        await mongoMemoryServer.stop();
    }
}
