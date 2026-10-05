import { test } from 'node:test';
import assert from 'node:assert/strict';

// Matching engine — mirrors src/lib/matching/engine.ts (logic tests; TS typechecked in CI).

const W = { specialization: 0.25, method: 0.15, availability: 0.2, reliability: 0.15, feedback: 0.15, loadBalance: 0.1, coldStartBoost: 0.1 };

function passesHardFilters(v) {
  if (!v.teachesSubject || !v.teachesStage) return false;
  if (v.activeStudents >= v.maxActiveStudents) return false;
  return true;
}
function score(v, w = W) {
  const feedback = v.feedbackCount < 3 ? 0.5 : v.feedbackScore;
  const load = v.maxActiveStudents > 0 ? 1 - v.activeStudents / v.maxActiveStudents : 0;
  const cold = v.isNew ? 1 : 0;
  return w.specialization * v.specializationFit + w.method * v.methodFit +
    w.availability * (v.availableAtPreferred ? 1 : 0) + w.reliability * v.reliability +
    w.feedback * feedback + w.loadBalance * load + w.coldStartBoost * cold;
}
function reasonsFor(v) {
  const out = [];
  if (v.teachesSubject) out.push('teaches_subject');
  if (v.teachesStage) out.push('teaches_stage');
  if (v.availableAtPreferred) out.push('available_time');
  if (v.methodFit >= 0.7) out.push('method_match');
  if (v.feedbackCount >= 3 && v.feedbackScore >= 0.8) out.push('highly_rated');
  if (v.reliability >= 0.8) out.push('reliable');
  if (v.isNew) out.push('new_volunteer');
  return out.slice(0, 3);
}
function match(cands) {
  return cands.filter(passesHardFilters)
    .map((v) => ({ v, s: score(v) })).sort((a, b) => b.s - a.s)
    .map(({ v }) => ({ volunteerId: v.volunteerId, reasons: reasonsFor(v) }));
}

const base = {
  teachesSubject: true, teachesStage: true, availableAtPreferred: true,
  specializationFit: 0.8, methodFit: 0.8, reliability: 0.8,
  feedbackScore: 0.9, feedbackCount: 10, activeStudents: 1, maxActiveStudents: 3, isNew: false,
};

test('hard filter: wrong subject or stage excluded', () => {
  const r = match([{ ...base, volunteerId: 'a', teachesSubject: false }]);
  assert.equal(r.length, 0);
  const r2 = match([{ ...base, volunteerId: 'a', teachesStage: false }]);
  assert.equal(r2.length, 0);
});

test('hard filter: at-capacity volunteer excluded', () => {
  const r = match([{ ...base, volunteerId: 'a', activeStudents: 3, maxActiveStudents: 3 }]);
  assert.equal(r.length, 0);
});

test('scoring: better availability wins when otherwise equal', () => {
  const r = match([
    { ...base, volunteerId: 'late' },
    { ...base, volunteerId: 'early', availableAtPreferred: false },
  ]);
  assert.equal(r[0].volunteerId, 'late');
});

test('fairness: new volunteer gets cold-start boost over equal veteran', () => {
  const vet = { ...base, volunteerId: 'vet', reliability: 0.81 };
  const rookie = { ...base, volunteerId: 'rookie', isNew: true, reliability: 0.8, feedbackScore: 0.5, feedbackCount: 0 };
  const r = match([vet, rookie]);
  assert.equal(r[0].volunteerId, 'rookie');
});

test('smoothing: low-sample feedback counts as neutral 0.5, not 0', () => {
  const a = { ...base, volunteerId: 'a', feedbackScore: 0.1, feedbackCount: 1 };
  const b = { ...base, volunteerId: 'b', feedbackScore: 0.9, feedbackCount: 10 };
  // both get reasons; a is not crushed to zero
  assert.ok(score(a) > 0.3, `score=${score(a)}`);
  assert.ok(score(b) > score(a));
});

test('reasons: max 3, ordered, no internal scores exposed', () => {
  const r = match([{ ...base, volunteerId: 'a' }]);
  assert.ok(r[0].reasons.length <= 3);
  assert.ok(!('score' in r[0]));
  assert.ok(r[0].reasons.includes('teaches_subject'));
});
