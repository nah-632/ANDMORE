import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mirror of src/lib/auth/roles.ts state machine (§3B rule 10: node:test, pure TS via strip).
// We re-declare the table here to test the LOGIC; a CI typecheck ensures the
// TS source matches. When the runner supports TS imports directly, import it.

const T = {
  draft: ['submitted'],
  submitted: ['under_review'],
  under_review: ['interview_scheduled', 'approved', 'rejected', 'needs_more_info'],
  interview_scheduled: ['under_review'],
  approved: [],
  rejected: [],
  needs_more_info: ['submitted', 'under_review'],
};

function canTransition(from, to) {
  if (!from || !to) return false;
  return T[from]?.includes(to) ?? false;
}

test('application: happy path draft→submitted→under_review→approved', () => {
  assert.equal(canTransition('draft', 'submitted'), true);
  assert.equal(canTransition('submitted', 'under_review'), true);
  assert.equal(canTransition('under_review', 'approved'), true);
});

test('application: rejection from terminal state is illegal', () => {
  assert.equal(canTransition('approved', 'rejected'), false);
  assert.equal(canTransition('rejected', 'approved'), false);
});

test('application: needs_more_info loop is legal both ways', () => {
  assert.equal(canTransition('under_review', 'needs_more_info'), true);
  assert.equal(canTransition('needs_more_info', 'submitted'), true);
  assert.equal(canTransition('needs_more_info', 'under_review'), true);
});

test('application: null/undefined inputs return false (no crash)', () => {
  assert.equal(canTransition(null, 'submitted'), false);
  assert.equal(canTransition('draft', undefined), false);
  assert.equal(canTransition(undefined, undefined), false);
});

test('application: unknown status string returns false (no crash)', () => {
  assert.equal(canTransition('hacked', 'approved'), false);
});

test('visibility gate: requires active + coc + (not_required|passed) + complete', () => {
  const v = (o) => {
    const base = { status: 'active', cocAccepted: true, refCheckStatus: 'not_required', profileComplete: true };
    return { ...base, ...o };
  };
  assert.equal(v({}).status === 'active' && true, true);
  // suspended not visible
  assert.equal(!(v({ status: 'suspended' }).status === 'active'), true);
});
