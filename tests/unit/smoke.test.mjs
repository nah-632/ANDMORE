import { test } from 'node:test';
import assert from 'node:assert/strict';

// P0 placeholder suite — real domain tests (state machines, matching,
// WhatsApp builder) arrive in P1+ per §20. This keeps the CI gate honest.
test('smoke: node:test runner works in CI', () => {
  assert.equal(1 + 1, 2);
});
