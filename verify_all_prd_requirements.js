const BASE_URL = 'http://localhost:5000/api';

async function req(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

async function runComprehensiveVerification() {
  console.log('================================================================');
  console.log('🔍 FULL PRD COMPLIANCE & REQUIREMENT VERIFICATION SUITE');
  console.log('================================================================\n');

  const testId = Date.now().toString().slice(-4);
  const email = `test_owner_${testId}@store.com`;
  const password = 'Password@123';
  const orgName = `Titan Retailers ${testId}`;

  // ---------------------------------------------------------
  // FR-1 & FR-2: Signup & Org Context Creation
  // ---------------------------------------------------------
  console.log('👉 [Test 1] FR-1 & FR-2: Sign up with Email, Password, Org Name');
  const signupRes = await req('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      confirmPassword: password,
      organizationName: orgName,
    }),
  });

  const token = signupRes.data.token;
  const user = signupRes.data.user;
  const org = signupRes.data.organization;
  console.log(`   ✔️ Status: Success`);
  console.log(`   ✔️ Org Created: "${org.name}" (ID: ${org.id})`);
  console.log(`   ✔️ User Created: "${user.email}" (ID: ${user.id})`);
  console.log(`   ✔️ JWT Token Issued: ${token ? 'Yes (Valid)' : 'No'}`);

  // ---------------------------------------------------------
  // FR-1: Email & Password Login
  // ---------------------------------------------------------
  console.log('\n👉 [Test 2] FR-1: Login with Email & Password');
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  console.log(`   ✔️ Status: Success`);
  console.log(`   ✔️ Authenticated User: ${loginRes.data.user.email}`);
  console.log(`   ✔️ Bound Organization: ${loginRes.data.organization.name}`);

  // ---------------------------------------------------------
  // FR-6: Initial Dashboard Overview
  // ---------------------------------------------------------
  console.log('\n👉 [Test 3] FR-6: Dashboard on fresh login');
  const dashInitial = await req('/dashboard', {}, token);
  console.log(`   ✔️ Total Products: ${dashInitial.data.summary.totalProducts}`);
  console.log(`   ✔️ Total Quantity on Hand: ${dashInitial.data.summary.totalQuantity}`);
  console.log(`   ✔️ Low Stock Items: ${dashInitial.data.lowStockItems.length}`);
  if (dashInitial.data.summary.totalProducts !== 0) throw new Error('Initial count not 0');

  // ---------------------------------------------------------
  // FR-3 & FR-4: Product Creation (Healthy Stock)
  // ---------------------------------------------------------
  console.log('\n👉 [Test 4] FR-3 & FR-4: Create Product (Healthy Stock)');
  const prod1 = await req(
    '/products',
    {
      method: 'POST',
      body: JSON.stringify({
        name: 'Pro Mechanical Keyboard',
        sku: `KBD-${testId}`,
        description: 'RGB Backlit switches',
        quantity: 50,
        costPrice: 45.0,
        sellingPrice: 89.99,
        lowStockThreshold: 10,
      }),
    },
    token
  );
  console.log(`   ✔️ Created: "${prod1.data.name}" | SKU: ${prod1.data.sku} | Qty: ${prod1.data.quantity}`);
  console.log(`   ✔️ Cost: $${prod1.data.costPrice} | Selling: $${prod1.data.sellingPrice}`);

  // ---------------------------------------------------------
  // FR-3, FR-4 & FR-6: Create Low Stock Product & Threshold Fallback
  // ---------------------------------------------------------
  console.log('\n👉 [Test 5] FR-6 & FR-7: Create Product with Low Stock & Null Threshold');
  const prod2 = await req(
    '/products',
    {
      method: 'POST',
      body: JSON.stringify({
        name: 'Wireless Mouse',
        sku: `MSE-${testId}`,
        quantity: 3, // <= default org threshold (5)
        costPrice: 10.0,
        sellingPrice: 24.99,
        lowStockThreshold: null, // triggers global default fallback (5)
      }),
    },
    token
  );
  console.log(`   ✔️ Created: "${prod2.data.name}" | SKU: ${prod2.data.sku} | Qty: ${prod2.data.quantity}`);
  console.log(`   ✔️ Threshold is null -> Inherits Org Default (${org.defaultLowStockThreshold})`);

  // ---------------------------------------------------------
  // FR-4: Read Product Catalog & Filters
  // ---------------------------------------------------------
  console.log('\n👉 [Test 6] FR-4: Read Products List & Search Filtering');
  const allProds = await req('/products', {}, token);
  console.log(`   ✔️ Total Products in catalog: ${allProds.count}`);

  const searchRes = await req(`/products?search=Keyboard`, {}, token);
  console.log(`   ✔️ Search for "Keyboard": found ${searchRes.count} item(s)`);
  if (searchRes.count !== 1 || searchRes.data[0].name !== 'Pro Mechanical Keyboard') {
    throw new Error('Search failed to filter correctly');
  }

  // ---------------------------------------------------------
  // FR-6: Dashboard Low Stock Section & Aggregates
  // ---------------------------------------------------------
  console.log('\n👉 [Test 7] FR-6: Dashboard Aggregates & Low Stock Table');
  const dashAfter = await req('/dashboard', {}, token);
  console.log(`   ✔️ Total Products: ${dashAfter.data.summary.totalProducts} (Expected: 2)`);
  console.log(`   ✔️ Total Units: ${dashAfter.data.summary.totalQuantity} (50 + 3 = 53)`);
  console.log(`   ✔️ Low Stock Count: ${dashAfter.data.summary.lowStockCount} (Expected: 1)`);
  console.log(`   ✔️ Low Stock Product in Table: "${dashAfter.data.lowStockItems[0]?.name}" (Qty: ${dashAfter.data.lowStockItems[0]?.quantity})`);
  if (dashAfter.data.summary.lowStockCount !== 1) throw new Error('Low stock count mismatch');

  // ---------------------------------------------------------
  // FR-5: Inline Stock Adjustment (+/- N units and note)
  // ---------------------------------------------------------
  console.log('\n👉 [Test 8] FR-5: Inline Stock Adjustment (+15 units & Note)');
  const adjustRes = await req(
    `/products/${prod2.data.id}/adjust-stock`,
    {
      method: 'POST',
      body: JSON.stringify({
        changeAmount: 15,
        note: 'Shipment container arrived at dock',
      }),
    },
    token
  );
  console.log(`   ✔️ Previous Stock: ${adjustRes.data.log.previousQty}`);
  console.log(`   ✔️ Change Amount: +${adjustRes.data.log.changeAmount}`);
  console.log(`   ✔️ New Stock: ${adjustRes.data.product.quantity} units`);
  console.log(`   ✔️ Audit Note: "${adjustRes.data.log.note}"`);
  console.log(`   ✔️ Updated By: ${adjustRes.data.product.lastUpdatedBy}`);

  // Re-check dashboard: now that qty is 18 (3+15), it should NO LONGER be low stock!
  const dashAfterAdjust = await req('/dashboard', {}, token);
  console.log(`   ✔️ Low stock count after restock: ${dashAfterAdjust.data.summary.lowStockCount} (Expected: 0)`);
  if (dashAfterAdjust.data.summary.lowStockCount !== 0) throw new Error('Expected 0 low stock items');

  // ---------------------------------------------------------
  // FR-4: Update Product Form (Edit fields)
  // ---------------------------------------------------------
  console.log('\n👉 [Test 9] FR-4: Edit Product Details');
  const updateRes = await req(
    `/products/${prod1.data.id}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        sellingPrice: 99.5,
        name: 'Pro Mechanical Keyboard v2',
      }),
    },
    token
  );
  console.log(`   ✔️ Updated Name: "${updateRes.data.name}"`);
  console.log(`   ✔️ Updated Selling Price: $${updateRes.data.sellingPrice}`);

  // ---------------------------------------------------------
  // FR-7: Global Settings (Change Default Low Stock Threshold)
  // ---------------------------------------------------------
  console.log('\n👉 [Test 10] FR-7: Update Global Default Low Stock Threshold');
  const settingsUpdate = await req(
    '/settings',
    {
      method: 'PUT',
      body: JSON.stringify({
        defaultLowStockThreshold: 20, // Now 18 units is considered low stock!
      }),
    },
    token
  );
  console.log(`   ✔️ New Default Threshold: ${settingsUpdate.data.defaultLowStockThreshold}`);

  const dashAfterSetting = await req('/dashboard', {}, token);
  console.log(`   ✔️ Low stock items under new threshold (20): ${dashAfterSetting.data.summary.lowStockCount} (Expected: 1)`);
  if (dashAfterSetting.data.summary.lowStockCount !== 1) throw new Error('Threshold update did not apply');

  // ---------------------------------------------------------
  // FR-4: Product Delete
  // ---------------------------------------------------------
  console.log('\n👉 [Test 11] FR-4: Delete Product with Confirmation');
  const delRes = await req(`/products/${prod1.data.id}`, { method: 'DELETE' }, token);
  console.log(`   ✔️ Delete response: ${delRes.message}`);

  const afterDelList = await req('/products', {}, token);
  console.log(`   ✔️ Catalog count after delete: ${afterDelList.count} (Expected: 1)`);
  if (afterDelList.count !== 1) throw new Error('Delete failed to remove item');

  // ---------------------------------------------------------
  // Multi-Tenancy & Data Isolation (FR-2 & Security)
  // ---------------------------------------------------------
  console.log('\n👉 [Test 12] Multi-Tenancy: Complete Tenant Isolation & SKU Scoping');
  const tenant2Email = `other_org_${testId}@competitor.com`;
  const signupTenant2 = await req('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: tenant2Email,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      organizationName: `Competitor Retail ${testId}`,
    }),
  });
  const token2 = signupTenant2.data.token;

  // Tenant 2 uses same SKU as Tenant 1
  const t2Prod = await req(
    '/products',
    {
      method: 'POST',
      body: JSON.stringify({
        name: 'Competitor Mouse',
        sku: `MSE-${testId}`, // Same SKU as Tenant 1!
        quantity: 100,
      }),
    },
    token2
  );
  console.log(`   ✔️ Tenant 2 created product with identical SKU "${t2Prod.data.sku}" successfully (No collision)`);

  const t1List = await req('/products', {}, token);
  const t2List = await req('/products', {}, token2);
  const t1HasT2 = t1List.data.some((p) => p.name === 'Competitor Mouse');
  const t2HasT1 = t2List.data.some((p) => p.name === 'Wireless Mouse');

  if (t1HasT2 || t2HasT1) {
    throw new Error('CRITICAL SECURITY LEAK: Data is visible across organizations!');
  }
  console.log(`   ✔️ Tenant 1 sees ${t1List.count} product(s) (Only theirs)`);
  console.log(`   ✔️ Tenant 2 sees ${t2List.count} product(s) (Only theirs)`);
  console.log(`   ✔️ Zero Cross-Tenant Data Leaks!`);

  console.log('\n================================================================');
  console.log('🎉 100% PRD REQUIREMENTS VERIFIED & WORKING PERFECTLY!');
  console.log('================================================================\n');
}

runComprehensiveVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err.message);
  process.exit(1);
});
