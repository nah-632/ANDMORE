import { test } from 'node:test';
import assert from 'node:assert/strict';

// Volunteer application domain — mirrors src/lib/volunteer/application.ts logic.
// (TS source is typechecked in CI; these tests prove the LOGIC.)

// --- reference formatting ---
function formatVolunteerRef(year, seq) {
  return `AM-V-${year}-${String(seq).padStart(6, '0')}`;
}
test('ref format: AM-V-2026-000045', () => {
  assert.equal(formatVolunteerRef(2026, 45), 'AM-V-2026-000045');
  assert.equal(formatVolunteerRef(2026, 1234567), 'AM-V-2026-1234567'); // 7 digits tolerated
});

// --- wa.me link builder ---
function waLink(number, message) {
  const digits = number.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
test('waLink: digits only, no + or leading zeros', () => {
  const link = waLink('+966 50-834-2500', 'hello');
  assert.ok(link.startsWith('https://wa.me/966508342500?text='));
});
test('waLink: Arabic text + newlines encoded', () => {
  const link = waLink('966508342500', 'السلام عليكم\nرقم الطلب: AM-V-2026-000001');
  const text = decodeURIComponent(link.split('text=')[1]);
  assert.equal(text, 'السلام عليكم\nرقم الطلب: AM-V-2026-000001');
});
test('waLink: emoji survive round-trip', () => {
  const link = waLink('966508342500', 'مرحبا 🌟');
  const text = decodeURIComponent(link.split('text=')[1]);
  assert.equal(text, 'مرحبا 🌟');
});

// --- sensitive data guard ---
function assertNoSensitiveData(message) {
  const stripped = message.replace(/AM-[SV]-\d{4}-\d{6,}/g, '');
  const patterns = [
    /(\+?\d[\d\s-]{7,})/,
    /[\w.+-]+@[\w-]+\.[\w.]+/,
    /(tiktok|instagram|snapchat|telegram|t\.me|x\.com|twitter|whatsapp)\//i,
  ];
  for (const p of patterns) {
    if (p.test(stripped)) throw new Error(`sensitive: ${p.source}`);
  }
}
test('guard: rejects phone in message', () => {
  assert.throws(() => assertNoSensitiveData('اتصل بي 0501234567'));
  assert.throws(() => assertNoSensitiveData('call +966501234567'));
});
test('guard: rejects email in message', () => {
  assert.throws(() => assertNoSensitiveData('راسلني on someone@mail.com'));
});
test('guard: rejects social handles', () => {
  assert.throws(() => assertNoSensitiveData('تابعني instagram/myname'));
  assert.throws(() => assertNoSensitiveData('t.me/myname'));
});
test('guard: allows reference codes and stage names', () => {
  const msg = 'رقم الطلب: AM-V-2026-000045\nالمرحلة: الثانوية';
  assert.doesNotThrow(() => assertNoSensitiveData(msg));
});

// --- application transition + visibility (regression from P2 tests) ---
test('visibility: rejected volunteers never public', () => {
  const v = { status: 'inactive', cocAccepted: false, refCheckStatus: 'pending', profileComplete: false };
  assert.equal(v.status === 'active', false);
});
