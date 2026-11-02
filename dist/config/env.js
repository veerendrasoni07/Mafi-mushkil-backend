"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI || '',
    jwt: {
        secret: process.env.JWT_SECRET || 'mafi_mushkil_secret_key_default',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'mafi_mushkil_refresh_secret_key_default',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    corsOrigin: process.env.CORS_ORIGIN || '*',
};
