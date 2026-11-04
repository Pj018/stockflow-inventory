import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET;

// Fail fast in production if JWT_SECRET is unset or using a default placeholder
if (NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET === 'stockflow_fallback_secret_key_mvp_2026')) {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be configured with a strong secret key in production.');
}

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: JWT_SECRET || 'dev_secret_key_do_not_use_in_production_12345',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};
