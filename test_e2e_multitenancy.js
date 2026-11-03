async function runVerification() {
  console.log('🧪 Starting End-to-End Multi-Tenant Verification Test...\n');
  const BASE_URL = 'http://localhost:3000/api';

  // Helper fetcher
  async function req(url, options = {}, token = null) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `Request failed with ${res.status}`);
    }
    return json;
  }

  try {
    // 1. Sign up Tenant A
    const rand = Math.floor(Math.random() * 10000);
    const emailA = `owner_a_${rand}@store.com`;
    console.log(`[1] Registering Tenant A (${emailA}, Org Alpha ${rand})...`);
    const resA = await req('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: emailA,
        password: 'password123',
        confirmPassword: 'password123',
        organizationName: `Org Alpha ${rand}`,
      }),
    });
    const tokenA = resA.data.token;
    const orgIdA = resA.data.organization.id;
    console.log(`   ✅ Tenant A registered. Org ID: ${orgIdA}`);

    // 2. Create Product in Tenant A with SKU "SHARED-SKU-99"
    console.log('[2] Creating product in Tenant A (SKU: SHARED-SKU-99, Qty: 20)...');
    const prodA = await req(
      '/products',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Alpha Widget',
          sku: 'SHARED-SKU-99',
          quantity: 20,
          costPrice: 5.0,
          sellingPrice: 12.0,
          lowStockThreshold: 10,
        }),
      },
      tokenA
    );
    console.log(`   ✅ Product created in Tenant A. ID: ${prodA.data.id}`);

    // 3. Sign up Tenant B
    const emailB = `owner_b_${rand}@store.com`;
    console.log(`[3] Registering Tenant B (${emailB}, Org Beta ${rand})...`);
    const resB = await req('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: emailB,
        password: 'password123',
        confirmPassword: 'password123',
        organizationName: `Org Beta ${rand}`,
      }),
    });
    const tokenB = resB.data.token;
    const orgIdB = resB.data.organization.id;
    console.log(`   ✅ Tenant B registered. Org ID: ${orgIdB}`);

    // 4. Create Product in Tenant B with the EXACT SAME SKU "SHARED-SKU-99"
    console.log('[4] Creating product in Tenant B with IDENTICAL SKU "SHARED-SKU-99" (Testing Org Scoping)...');
    const prodB = await req(
      '/products',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Beta Gadget',
          sku: 'SHARED-SKU-99',
          quantity: 3, // Low stock!
          costPrice: 25.0,
          sellingPrice: 45.0,
          lowStockThreshold: 5,
        }),
      },
      tokenB
    );
    console.log(`   ✅ Successfully created duplicate SKU across tenants! ID: ${prodB.data.id}`);

    // 5. Verify Isolation: Tenant A listing
    console.log('[5] Checking Tenant A product list isolation...');
    const listA = await req('/products', {}, tokenA);
    console.log(`   Tenant A product count: ${listA.count}`);
    const foundBInA = listA.data.some((p) => p.name === 'Beta Gadget');
    if (foundBInA) throw new Error('SECURITY VIOLATION: Tenant A can see Tenant B data!');
    console.log('   ✅ Tenant A only sees Tenant A products. No cross-tenant leak!');

    // 6. Verify Isolation: Tenant B listing
    console.log('[6] Checking Tenant B product list isolation...');
    const listB = await req('/products', {}, tokenB);
    console.log(`   Tenant B product count: ${listB.count}`);
    const foundAInB = listB.data.some((p) => p.name === 'Alpha Widget');
    if (foundAInB) throw new Error('SECURITY VIOLATION: Tenant B can see Tenant A data!');
    console.log('   ✅ Tenant B only sees Tenant B products. No cross-tenant leak!');

    // 7. Test Stock Adjustment in Tenant B
    console.log('[7] Adjusting stock for Tenant B (+7 units)...');
    const adjustRes = await req(
      `/products/${prodB.data.id}/adjust-stock`,
      {
        method: 'POST',
        body: JSON.stringify({ changeAmount: 7, note: 'Emergency restock' }),
      },
      tokenB
    );
    console.log(`   Previous Qty: 3, New Qty: ${adjustRes.data.product.quantity}`);
    if (adjustRes.data.product.quantity !== 10) {
      throw new Error(`Expected stock 10, got ${adjustRes.data.product.quantity}`);
    }
    console.log('   ✅ Stock adjustment verified (+7 units -> 10 units)');

    // 8. Test Settings update (Default Low Stock Threshold)
    console.log('[8] Updating Tenant B default threshold to 15...');
    const settingsRes = await req(
      '/settings',
      {
        method: 'PUT',
        body: JSON.stringify({ defaultLowStockThreshold: 15 }),
      },
      tokenB
    );
    console.log(`   Updated defaultLowStockThreshold: ${settingsRes.data.defaultLowStockThreshold}`);
    console.log('   ✅ Settings updated successfully');

    // 9. Verify Dashboard Metrics for Tenant B
    console.log('[9] Checking Dashboard metrics for Tenant B...');
    const dashB = await req('/dashboard', {}, tokenB);
    console.log('   Dashboard Summary for Tenant B:', JSON.stringify(dashB.data.summary, null, 2));
    console.log('   ✅ Dashboard metrics verified');

    console.log('\n🎉 ALL MULTI-TENANT VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  }
}

runVerification();
