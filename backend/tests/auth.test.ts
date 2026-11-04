import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Authentication & Authorization Suite', () => {
  const uniqueSuffix = Date.now();
  const testUser = {
    email: `test_user_${uniqueSuffix}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    organizationName: `Test Org ${uniqueSuffix}`,
  };

  let authToken = '';

  it('should successfully register a new tenant and user (201)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.organization.name).toBe(testUser.organizationName);

    authToken = res.body.data.token;
  });

  it('should reject signup with duplicate email address (409)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject password shorter than 8 characters (400)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `short_${Date.now()}@example.com`,
        password: 'pass',
        confirmPassword: 'pass',
        organizationName: 'Short Pass Store',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully login with valid credentials (200)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it('should prevent account enumeration by returning identical generic error for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: `non_existent_${Date.now()}@domain.com`,
        password: 'SomePassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password. Please verify your credentials.');
  });

  it('should prevent account enumeration by returning identical generic error for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'CompletelyWrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password. Please verify your credentials.');
  });

  it('should return profile for authenticated user via /api/auth/me (200)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.organization.name).toBe(testUser.organizationName);
  });

  it('should reject unauthenticated request to /api/auth/me (401)', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
