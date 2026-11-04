const fs = require('fs');
const path = require('path');

const rootEnvPath = path.resolve(__dirname, '../.env');
const backendEnvPath = path.resolve(__dirname, '../backend/.env');

const defaultEnvContent = [
  'PORT=10000',
  'DATABASE_URL="file:./dev.db"',
  'JWT_SECRET="stockflow_production_secure_jwt_secret_key_2026_mvp!"',
  'JWT_EXPIRES_IN="7d"',
  'NODE_ENV="production"',
].join('\n') + '\n';

// Clean up any conflicting prisma/.env if it exists
const prismaEnvPath = path.resolve(__dirname, '../backend/prisma/.env');
if (fs.existsSync(prismaEnvPath)) {
  fs.unlinkSync(prismaEnvPath);
}

// Ensure backend/.env exists
if (!fs.existsSync(backendEnvPath)) {
  fs.writeFileSync(backendEnvPath, defaultEnvContent);
  console.log('✅ Created backend/.env with default cloud configuration.');
}

// Ensure root .env exists
if (!fs.existsSync(rootEnvPath)) {
  fs.writeFileSync(rootEnvPath, defaultEnvContent);
  console.log('✅ Created root .env for build process.');
}
