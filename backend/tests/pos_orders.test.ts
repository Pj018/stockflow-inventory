import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Commercial POS & Bulk Import Suite', () => {
  const seed = Date.now();
  let token = '';
  let tokenOther = '';
  let productId = '';

  beforeAll(async () => {
    // Register Tenant 1
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `pos_store_${seed}@retail.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: `Retail POS ${seed}`,
      });
    token = res.body.data.token;

    // Register Tenant 2 (Other store)
    const resOther = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `pos_other_${seed}@retail.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: `Competitor POS ${seed}`,
      });
    tokenOther = resOther.body.data.token;

    // Create a product with 20 units
    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Wireless Bluetooth Headset',
        sku: `HEADSET-${seed}`,
        quantity: 20,
        costPrice: 500,
        sellingPrice: 1200,
        lowStockThreshold: 5,
      });
    productId = prodRes.body.data.id;
  });

  it('should successfully complete a POS sale and deduct inventory', async () => {
    const saleRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Aarav Patel',
        customerPhone: '+91 9876543210',
        paymentMethod: 'UPI',
        discountAmount: 100,
        taxAmount: 50,
        items: [
          {
            productId,
            quantity: 3,
            unitPrice: 1200,
          },
        ],
      });

    expect(saleRes.status).toBe(201);
    expect(saleRes.body.success).toBe(true);
    expect(saleRes.body.data.customerName).toBe('Aarav Patel');
    expect(saleRes.body.data.subtotal).toBe(3600); // 3 * 1200
    expect(saleRes.body.data.totalAmount).toBe(3550); // 3600 - 100 + 50
    expect(saleRes.body.data.items).toHaveLength(1);

    // Verify product stock was decremented from 20 to 17
    const checkProd = await request(app)
      .get(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(checkProd.status).toBe(200);
    expect(checkProd.body.data.quantity).toBe(17);

    // Verify stock log was created
    const logs = checkProd.body.data.stockLogs;
    expect(logs[0].changeAmount).toBe(-3);
    expect(logs[0].note).toMatch(/POS Sale/);
  });

  it('should reject a sale if requested quantity exceeds available stock (400)', async () => {
    const saleRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentMethod: 'CASH',
        items: [
          {
            productId,
            quantity: 50, // Only 17 left
          },
        ],
      });

    expect(saleRes.status).toBe(400);
    expect(saleRes.body.success).toBe(false);
    expect(saleRes.body.message).toMatch(/Insufficient stock/);
  });

  it('should prevent cross-tenant sales (Tenant B cannot sell Tenant A products)', async () => {
    const saleRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenOther}`)
      .send({
        paymentMethod: 'CASH',
        items: [
          {
            productId, // Belongs to Tenant A
            quantity: 1,
          },
        ],
      });

    expect(saleRes.status).toBe(404);
  });

  it('should bulk import products via CSV payload', async () => {
    const importRes = await request(app)
      .post('/api/products/bulk-import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        products: [
          {
            name: 'Fast Charger 65W',
            sku: `CHG-65W-${seed}`,
            quantity: 30,
            costPrice: 400,
            sellingPrice: 999,
            category: 'Electronics',
          },
          {
            name: 'Braided Type-C Cable',
            sku: `CBL-TC-${seed}`,
            quantity: 100,
            costPrice: 50,
            sellingPrice: 199,
            category: 'Accessories',
          },
        ],
      });

    expect(importRes.status).toBe(200);
    expect(importRes.body.success).toBe(true);
    expect(importRes.body.data.totalProcessed).toBe(2);
    expect(importRes.body.data.created).toBe(2);

    // Verify imported products are in catalog
    const listRes = await request(app)
      .get(`/api/products?search=Charger`)
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should create and retrieve suppliers for the organization', async () => {
    const createSup = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Apex Wholesale Distributors',
        contactPerson: 'Rajesh Sharma',
        email: 'rajesh@apexwholesale.com',
        phone: '+91 9988776655',
        address: 'Sector 18, Electronic City',
      });

    expect(createSup.status).toBe(201);
    expect(createSup.body.data.name).toBe('Apex Wholesale Distributors');

    const listSup = await request(app)
      .get('/api/suppliers')
      .set('Authorization', `Bearer ${token}`);

    expect(listSup.status).toBe(200);
    expect(listSup.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
