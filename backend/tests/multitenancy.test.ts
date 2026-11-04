import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Multi-Tenancy Isolation Suite', () => {
  const seed = Date.now();
  let tokenA = '';
  let tokenB = '';
  let orgIdA = '';
  let orgIdB = '';
  let productAId = '';
  let productBId = '';

  const sharedSku = `SHARED-SKU-${seed}`;

  beforeAll(async () => {
    // 1. Register Tenant A
    const resA = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `tenant_a_${seed}@corp.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: `Org Alpha ${seed}`,
      });
    tokenA = resA.body.data.token;
    orgIdA = resA.body.data.organization.id;

    // 2. Register Tenant B
    const resB = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `tenant_b_${seed}@corp.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: `Org Beta ${seed}`,
      });
    tokenB = resB.body.data.token;
    orgIdB = resB.body.data.organization.id;
  });

  it('should allow both tenants to create products with the identical SKU without conflict', async () => {
    // Tenant A creates product with sharedSku
    const resA = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Alpha Widget',
        sku: sharedSku,
        quantity: 25,
        costPrice: 10,
        sellingPrice: 20,
      });

    expect(resA.status).toBe(201);
    expect(resA.body.data.sku).toBe(sharedSku);
    productAId = resA.body.data.id;

    // Tenant B creates product with the exact same sharedSku
    const resB = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Beta Gadget',
        sku: sharedSku,
        quantity: 50,
        costPrice: 30,
        sellingPrice: 60,
      });

    expect(resB.status).toBe(201);
    expect(resB.body.data.sku).toBe(sharedSku);
    productBId = resB.body.data.id;

    expect(productAId).not.toBe(productBId);
  });

  it('should only return Tenant A products when Tenant A fetches products list', async () => {
    const resA = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    const ids = resA.body.data.map((p: any) => p.id);
    expect(ids).toContain(productAId);
    expect(ids).not.toContain(productBId);
  });

  it('should prevent cross-tenant read by ID (Tenant B cannot read Tenant A product)', async () => {
    const res = await request(app)
      .get(`/api/products/${productAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  it('should prevent cross-tenant updates (Tenant B cannot update Tenant A product)', async () => {
    const res = await request(app)
      .put(`/api/products/${productAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Malicious Injected Name',
      });

    expect(res.status).toBe(404);
  });

  it('should prevent cross-tenant stock adjustments (Tenant B cannot adjust Tenant A stock)', async () => {
    const res = await request(app)
      .post(`/api/products/${productAId}/adjust-stock`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        changeAmount: -10,
        note: 'Cross-tenant illegal decrement',
      });

    expect(res.status).toBe(404);
  });

  it('should prevent cross-tenant deletions (Tenant B cannot delete Tenant A product)', async () => {
    const res = await request(app)
      .delete(`/api/products/${productAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);

    // Verify Tenant A product still exists intact
    const verifyRes = await request(app)
      .get(`/api/products/${productAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.name).toBe('Alpha Widget');
  });

  it('should isolate dashboard metrics between tenants', async () => {
    const metricsA = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${tokenA}`);

    const metricsB = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(metricsA.status).toBe(200);
    expect(metricsB.status).toBe(200);

    expect(metricsA.body.data.organization.id).toBe(orgIdA);
    expect(metricsB.body.data.organization.id).toBe(orgIdB);
  });
});
