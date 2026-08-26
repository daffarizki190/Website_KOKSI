# Security Audit Report
**Target:** `server.ts` & API Architecture
**Date:** August 26, 2026

## 1. Hardcoded Cryptographic Secrets (Critical)
**Flaw:** `process.env.JWT_SECRET || 'supersecretjwtkey_koperasi'` (and VAPID keys) fallback to hardcoded strings if the `.env` file is missing.
**Exploit:** An attacker who knows this repository is public or guesses the fallback string can forge administrative JWT tokens, gaining full unauthorized access to the system.
**Fix:** Remove the fallback. The server must crash/fail to start if secrets are missing.
```typescript
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
}
const JWT_SECRET = process.env.JWT_SECRET;
```

## 2. In-Memory Rate Limiter Map Exhaustion (High)
**Flaw:** The rate limiter uses a JS `Map` (`rateLimitStore`) without a mechanism to delete old IP entries after the window expires.
**Exploit:** An attacker can launch a Distributed Denial of Service (DDoS) attack by sending requests from thousands of spoofed IPs. The `Map` will grow indefinitely, causing a Memory Leak and eventually crashing the Node.js process (OOM).
**Fix:** Use a time-based eviction loop or a standard library like `express-rate-limit`. If keeping the Map, run an interval to sweep expired entries:
```typescript
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) rateLimitStore.delete(ip);
  }
}, 60 * 1000);
```

## 3. IP Spoofing on Rate Limiter (Medium)
**Flaw:** `const clientIp = req.headers['x-forwarded-for'] || req.ip;`.
**Exploit:** If the Node app is directly exposed (not behind a reverse proxy that strips headers), an attacker can inject a fake `X-Forwarded-For` header to bypass the rate limiter completely.
**Fix:** Only read `X-Forwarded-For` if you explicitly trust the proxy.
```typescript
// Enable proxy trust in express if behind Vercel/Nginx
app.set('trust proxy', 1);
const clientIp = req.ip; // Express handles it securely when trust proxy is set
```

## 4. SQL Injection via ORM Misuse (Medium - Needs Verification)
**Flaw:** (General finding) Ensure that all Drizzle ORM queries use parameterized inputs (`eq(users.id, req.body.id)`) and never use raw SQL string concatenation `sql\`... ${req.body.id} \``.
**Fix:** Always rely on Drizzle's typed query builders.
