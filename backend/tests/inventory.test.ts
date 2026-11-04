import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Inventory & Stock Management Suite', () => {
  const seed = Date.now();
  let token = '';
  let createdProductId = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `inventory_tester_${seed}@retail.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: `Retail Mart ${seed}`,
      });
    token = res.body.data.token;
  });

  it('should create a product with valid fields (201)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'USB-C Cable 2M',
        sku: `CABLE-${seed}`,
        description: 'Braided fast charging cable',
        quantity: 15,
        costPrice: 4.5,
        sellingPrice: 12.99,
        lowStockThreshold: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('USB-C Cable 2M');
    expect(res.body.data.quantity).toBe(15);
    createdProductId = res.body.data.id;
  });

  it('should reject duplicate SKU within the same organization (409)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Duplicate Cable',
        sku: `CABLE-${seed}`,
        quantity: 10,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should adjust stock up and generate an audit log entry', async () => {
    const res = await request(app)
      .post(`/api/products/${createdProductId}/adjust-stock`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        changeAmount: 10,
        note: 'Restock shipment received',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.product.quantity).toBe(25);
    expect(res.body.data.log.previousQty).toBe(15);
    expect(res.body.data.log.newQty).toBe(25);
    expect(res.body.data.log.changeAmount).toBe(10);
    expect(res.body.data.log.note).toBe('Restock shipment received');
  });

  it('should adjust stock down and generate an audit log entry', async () => {
    const res = await request(app)
      .post(`/api/products/${createdProductId}/adjust-stock`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        changeAmount: -5,
        note: 'Damaged goods write-off',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.product.quantity).toBe(20);
    expect(res.body.data.log.previousQty).toBe(25);
    expect(res.body.data.log.newQty).toBe(20);
    expect(res.body.data.log.changeAmount).toBe(-5);
  });

  it('should prevent stock adjustment that would result in negative quantity (400)', async () => {
    const res = await request(app)
      .post(`/api/products/${createdProductId}/adjust-stock`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        changeAmount: -100, // Current stock is 20
        note: 'Excessive deduction',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Cannot reduce stock by 100/);
  });

  it('should calculate low stock status accurately in product queries', async () => {
    // Deduct stock down to 4 (threshold is 5)
    await request(app)
      .post(`/api/products/${createdProductId}/adjust-stock`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        changeAmount: -16, // 20 - 16 = 4
        note: 'Sale order fulfilled',
      });

    const res = await request(app)
      .get('/api/products?lowStockOnly=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const lowStockProduct = res.body.data.find((p: any) => p.id === createdProductId);
    expect(lowStockProduct).toBeDefined();
    expect(lowStockProduct.isLowStock).toBe(true);
    expect(lowStockProduct.quantity).toBe(4);
  });

  it('should delete product successfully (200)', async () => {
    const res = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify deletion
    const getRes = await request(app)
      .get(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });
});
