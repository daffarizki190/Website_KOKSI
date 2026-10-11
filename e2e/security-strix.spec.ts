import { test, expect } from '@playwright/test';

test.describe('STRIX Security & Penetration Suite - BelanjaIn Saza', () => {

  let userToken: string;
  let adminToken: string;

  test.beforeAll(async ({ playwright }) => {
    const apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000'
    });

    // Login as regular employee/user
    const userRes = await apiContext.post('/api/auth/login', {
      data: { no_hp: '081222333444', password: 'user123' }
    });
    if (userRes.ok()) {
      const data = await userRes.json();
      userToken = data.token;
    }

    // Login as admin
    const adminRes = await apiContext.post('/api/auth/login', {
      data: { no_hp: '081234567890', password: 'admin123' }
    });
    if (adminRes.ok()) {
      const data = await adminRes.json();
      adminToken = data.token;
    }
  });

  test('[STRIX-01] Role-Based Access Control: Regular user cannot access Admin endpoints', async ({ playwright }) => {
    const apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    // Coba akses endpoint admin users (/api/users)
    const res = await apiContext.get('/api/users');
    expect([401, 403]).toContain(res.status());
  });

  test('[STRIX-02] Role-Based Access Control: Regular user cannot access IT Dashboard endpoints', async ({ playwright }) => {
    const apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    // Coba akses endpoint IT summary
    const res = await apiContext.get('/api/it/summary');
    expect([401, 403]).toContain(res.status());
  });

  test('[STRIX-03] Authentication: Invalid login credentials return 401 Unauthorized', async ({ playwright }) => {
    const apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000'
    });

    const res = await apiContext.post('/api/auth/login', {
      data: { no_hp: '081222333444', password: 'wrongpassword999' }
    });
    expect(res.status()).toBe(401);
  });

  test('[STRIX-04] Injection Protection: Malicious SQL / Script payload in login is rejected safely', async ({ playwright }) => {
    const apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000'
    });

    const res = await apiContext.post('/api/auth/login', {
      data: { no_hp: "' OR '1'='1", password: "' OR '1'='1" }
    });
    // Harus gagal otentikasi (401 atau 400), bukan crash 500
    expect([400, 401]).toContain(res.status());
  });

  test('[STRIX-05] Idempotency Protection: Duplicate checkout request with same key returns identical order without double billing', async ({ playwright }) => {
    if (!userToken) return;

    const testIdempotencyKey = 'strix-idem-' + Date.now() + '-secure';
    const apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': testIdempotencyKey
      }
    });

    // Request checkout pertama
    const res1 = await apiContext.post('/api/orders', {
      data: {
        items: [{ productId: 1, quantity: 1 }],
        idempotencyKey: testIdempotencyKey
      }
    });

    // Jika layanan pemesanan sedang ditutup (hari selain Senin-Selasa), sistem mengembalikan 403 dengan aman
    if (res1.status() === 403) {
      const data = await res1.json();
      expect(data.error).toBeDefined();
      return;
    }

    if (res1.ok()) {
      const data1 = await res1.json();
      const firstOrderId = data1.id || data1.orderId;

      // Request kedua (simulasi double-tap atau retry network)
      const res2 = await apiContext.post('/api/orders', {
        data: {
          items: [{ productId: 1, quantity: 1 }],
          idempotencyKey: testIdempotencyKey
        }
      });

      expect(res2.ok()).toBeTruthy();
      const data2 = await res2.json();
      const secondOrderId = data2.id || data2.orderId;

      // Order ID harus identik (tidak menduplikasi pesanan)
      expect(secondOrderId).toBe(firstOrderId);
    }
  });

  test('[STRIX-06] Security Headers: Essential HTTP security headers are present in response', async ({ playwright }) => {
    const apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000'
    });

    const res = await apiContext.get('/api/settings/demo-mode');
    const headers = res.headers();

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  });

});
