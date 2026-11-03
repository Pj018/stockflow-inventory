// Automated Validation & Error Handling Verification
const http = require('http');

function request(path, options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:5000${path}`,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Error & Validation Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(title, condition, detail) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} ->`, detail);
    }
  }

  // TEST 1: Login with non-existent email
  const res1 = await request('/api/auth/login', { method: 'POST' }, {
    email: 'nonexistent_user_9999@example.com',
    password: 'password123',
  });
  assert(
    'Login: Non-existent email returns clear message and email field flag',
    res1.status === 401 &&
    res1.data.message.includes('No account found with this email address') &&
    res1.data.details?.field === 'email',
    res1
  );

  // TEST 2: Login with existing user but incorrect password
  const res2 = await request('/api/auth/login', { method: 'POST' }, {
    email: 'demo@stockflow.com',
    password: 'wrong_password_xyz',
  });
  assert(
    'Login: Incorrect password returns clear password error and password field flag',
    res2.status === 401 &&
    res2.data.message.includes('Incorrect password') &&
    res2.data.details?.field === 'password',
    res2
  );

  // TEST 3: Login with invalid email syntax
  const res3 = await request('/api/auth/login', { method: 'POST' }, {
    email: 'notanemail',
    password: 'password123',
  });
  assert(
    'Login: Invalid email syntax returns 400 with specific validator message',
    res3.status === 400 &&
    res3.data.message.includes('valid email address'),
    res3
  );

  // TEST 4: Signup with duplicate email (demo@stockflow.com)
  const res4 = await request('/api/auth/signup', { method: 'POST' }, {
    email: 'demo@stockflow.com',
    password: 'password123',
    confirmPassword: 'password123',
    organizationName: 'Duplicate Store',
  });
  assert(
    'Signup: Duplicate email returns 409 Conflict',
    res4.status === 409 &&
    res4.data.message.includes('already exists'),
    res4
  );

  // TEST 5: Signup with passwords not matching
  const res5 = await request('/api/auth/signup', { method: 'POST' }, {
    email: 'newuser12345@stockflow.com',
    password: 'password123',
    confirmPassword: 'password_different',
    organizationName: 'Store Name',
  });
  assert(
    'Signup: Passwords not matching returns 400 with validation message',
    res5.status === 400 &&
    res5.data.message.includes('Passwords do not match'),
    res5
  );

  // Authenticate as demo user to test product and settings validations
  const loginRes = await request('/api/auth/login', { method: 'POST' }, {
    email: 'demo@stockflow.com',
    password: 'password123',
  });
  const token = loginRes.data.data.token;

  // TEST 6: Create product with negative quantity
  const res6 = await request('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    name: 'Invalid Test Product',
    sku: 'TEST-SKU-INVALID-01',
    quantity: -5,
  });
  assert(
    'Product: Negative quantity returns 400 with validation message',
    res6.status === 400 &&
    res6.data.message.includes('Quantity cannot be negative'),
    res6
  );

  // TEST 7: Create product with negative cost price
  const res7 = await request('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    name: 'Invalid Test Product',
    sku: 'TEST-SKU-INVALID-02',
    quantity: 10,
    costPrice: -100,
  });
  assert(
    'Product: Negative cost price returns 400 with validation message',
    res7.status === 400 &&
    res7.data.message.includes('Cost price cannot be negative'),
    res7
  );

  // TEST 8: Adjust stock by 0
  const productsRes = await request('/api/products', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const firstProd = productsRes.data.data[0];

  const res8 = await request(`/api/products/${firstProd.id}/adjust-stock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    changeAmount: 0,
    note: 'Zero adjustment test',
  });
  assert(
    'Stock Adjust: Zero adjustment amount returns 400 validation message',
    res8.status === 400 &&
    res8.data.message.includes('Adjustment amount cannot be zero'),
    res8
  );

  // TEST 9: Adjust stock below 0
  const res9 = await request(`/api/products/${firstProd.id}/adjust-stock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    changeAmount: -(firstProd.quantity + 9999),
    note: 'Excessive decrement',
  });
  assert(
    'Stock Adjust: Decrement below zero returns 400 with current stock detail',
    res9.status === 400 &&
    res9.data.message.includes('Cannot reduce stock by'),
    res9
  );

  // TEST 10: Settings with negative threshold
  const res10 = await request('/api/settings', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    defaultLowStockThreshold: -10,
  });
  assert(
    'Settings: Negative low stock threshold returns 400 validation message',
    res10.status === 400 &&
    res10.data.message.includes('Default threshold cannot be negative'),
    res10
  );

  console.log(`\n===============================================`);
  console.log(`🏁 Results: ${passed}/${total} validation tests passed!`);
  console.log(`===============================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
