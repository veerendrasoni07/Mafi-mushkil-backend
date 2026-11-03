"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
async function connectDatabase() {
    const uri = env_1.config.mongoUri;
    if (!uri) {
        throw new Error('[Database] MONGODB_URI environment variable is required.');
    }
    try {
        await mongoose_1.default.connect(uri);
        console.log('[Database] MongoDB connected successfully.');
    }
    catch (error) {
        console.error('[Database] MongoDB connection failed:', error);
        throw error;
    }
}
async function disconnectDatabase() {
    await mongoose_1.default.disconnect();
    console.log('[Database] MongoDB disconnected.');
}
