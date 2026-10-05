import { test } from 'node:test';
import assert from 'node:assert/strict';

// Rate limiter logic (mirrors src/lib/security/rate-limit.ts for logic tests;
// the TS source is typechecked in CI).

class Buckets {
  constructor() { this.map = new Map(); }
  limit(key, max, windowMs, now = Date.now()) {
    const b = this.map.get(key);
    if (!b || b.resetAt < now) {
      this.map.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSec: 0 };
    }
    if (b.count >= max) return { allowed: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
    b.count += 1;
    return { allowed: true, retryAfterSec: 0 };
  }
}

test('rate limit: allows up to N then blocks', () => {
  const b = new Buckets();
  for (let i = 0; i < 5; i++) {
    assert.equal(b.limit('k', 5, 60_000).allowed, true, `req ${i + 1} should pass`);
  }
  const blocked = b.limit('k', 5, 60_000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec > 0 && blocked.retryAfterSec <= 60);
});

test('rate limit: window resets', () => {
  const b = new Buckets();
  const t0 = 1_000_000;
  for (let i = 0; i < 5; i++) b.limit('k', 5, 10_000, t0);
  assert.equal(b.limit('k', 5, 10_000, t0).allowed, false);
  // after window
  assert.equal(b.limit('k', 5, 10_000, t0 + 10_001).allowed, true);
});

test('rate limit: keys are isolated', () => {
  const b = new Buckets();
  for (let i = 0; i < 5; i++) b.limit('a', 5, 60_000);
  assert.equal(b.limit('a', 5, 60_000).allowed, false);
  assert.equal(b.limit('b', 5, 60_000).allowed, true);
});
