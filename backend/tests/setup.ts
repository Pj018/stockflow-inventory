import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_vitest_execution_12345';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';

beforeAll(async () => {
  // Ensure DB is connected
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
