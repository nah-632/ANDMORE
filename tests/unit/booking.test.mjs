import { test } from 'node:test';
import assert from 'node:assert/strict';

// Session booking domain — mirrors src/lib/booking/session.ts (logic tests).

function formatSessionRef(year, seq) {
  return `AM-S-${year}-${String(seq).padStart(6, '0')}`;
}
test('session ref format', () => {
  assert.equal(formatSessionRef(2026, 123), 'AM-S-2026-000123');
});

const T = {
  requested: ['under_review'],
  under_review: ['matched', 'expired'],
  matched: ['pending_volunteer_confirmation'],
  pending_volunteer_confirmation: ['confirmed', 'matched', 'expired'],
  confirmed: ['in_progress', 'cancelled_by_student', 'cancelled_by_volunteer', 'cancelled_by_admin'],
  in_progress: ['completed', 'no_show_student', 'no_show_volunteer'],
  completed: ['evaluated', 'disputed'],
  evaluated: ['disputed'],
  cancelled_by_student: [], cancelled_by_volunteer: [], cancelled_by_admin: [],
  no_show_student: [], no_show_volunteer: [], expired: [], disputed: [],
};
function canTransitionSession(from, to) {
  if (!from || !to) return false;
  return T[from]?.includes(to) ?? false;
}

test('session happy path: requested → ... → evaluated', () => {
  assert.equal(canTransitionSession('requested', 'under_review'), true);
  assert.equal(canTransitionSession('under_review', 'matched'), true);
  assert.equal(canTransitionSession('matched', 'pending_volunteer_confirmation'), true);
  assert.equal(canTransitionSession('pending_volunteer_confirmation', 'confirmed'), true);
  assert.equal(canTransitionSession('confirmed', 'in_progress'), true);
  assert.equal(canTransitionSession('in_progress', 'completed'), true);
  assert.equal(canTransitionSession('completed', 'evaluated'), true);
});

test('session: expired reachable only from under_review / pending', () => {
  assert.equal(canTransitionSession('under_review', 'expired'), true);
  assert.equal(canTransitionSession('pending_volunteer_confirmation', 'expired'), true);
  assert.equal(canTransitionSession('confirmed', 'expired'), false);
});

test('session: cannot skip states', () => {
  assert.equal(canTransitionSession('requested', 'confirmed'), false);
  assert.equal(canTransitionSession('matched', 'in_progress'), false);
  assert.equal(canTransitionSession(null, 'confirmed'), false);
});

function canCancel(status, scheduledStart, now, minNoticeHours = 24) {
  const cancellable = ['requested', 'matched', 'pending_volunteer_confirmation', 'confirmed'];
  if (!cancellable.includes(status)) return false;
  return scheduledStart.getTime() - now.getTime() >= minNoticeHours * 3600_000;
}

test('cancellation rule: 24h notice enforced', () => {
  const start = new Date('2026-10-10T15:00:00Z');
  const now1 = new Date('2026-10-09T14:00:00Z'); // 25h before — allowed
  const now2 = new Date('2026-10-09T16:00:00Z'); // 23h before — too late
  assert.equal(canCancel('confirmed', start, now1), true);
  assert.equal(canCancel('confirmed', start, now2), false);
  assert.equal(canCancel('completed', start, now1), false); // terminal state
});
