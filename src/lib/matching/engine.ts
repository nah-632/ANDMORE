/**
 * Matching engine (§8): deterministic, explainable, testable. Pure TS.
 *
 * Hard filters first (approved+active, subject, stage, availability, capacity),
 * then weighted scoring with weights from platform_settings (versioned).
 * Every recommendation returns human-readable reasons in the user's language;
 * internal scores are NEVER exposed to end users (§8).
 */
export type VolunteerCandidate = {
  volunteerId: string;
  teachesSubject: boolean;
  teachesStage: boolean;
  availableAtPreferred: boolean;
  specializationFit: number;   // 0..1
  methodFit: number;           // 0..1
  reliability: number;         // 0..1 (recent activity)
  feedbackScore: number;       // 0..1 (with smoothing applied upstream)
  feedbackCount: number;
  activeStudents: number;
  maxActiveStudents: number;
  isNew: boolean;
};

export type MatchingWeights = {
  specialization: number;
  method: number;
  availability: number;
  reliability: number;
  feedback: number;
  loadBalance: number;
  coldStartBoost: number;
};

export const DEFAULT_WEIGHTS: MatchingWeights = {
  specialization: 0.25,
  method: 0.15,
  availability: 0.2,
  reliability: 0.15,
  feedback: 0.15,
  loadBalance: 0.1,
  coldStartBoost: 0.1,
};

export type ReasonKey = 'teaches_subject' | 'teaches_stage' | 'available_time' | 'method_match' | 'highly_rated' | 'reliable' | 'new_volunteer';

export type MatchResult = {
  volunteerId: string;
  reasons: ReasonKey[];
};

/** Hard filters: subject, stage, capacity. */
export function passesHardFilters(
  v: VolunteerCandidate,
  opts: { capacityEnforced: boolean }
): boolean {
  if (!v.teachesSubject || !v.teachesStage) return false;
  if (opts.capacityEnforced && v.activeStudents >= v.maxActiveStudents) return false;
  return true;
}

/** Weighted score (internal — never exposed). */
export function score(v: VolunteerCandidate, w: MatchingWeights): number {
  const feedback = v.feedbackCount < 3 ? 0.5 : v.feedbackScore; // minimum-sample smoothing (§8)
  const load = v.maxActiveStudents > 0 ? 1 - v.activeStudents / v.maxActiveStudents : 0;
  const cold = v.isNew ? 1 : 0;
  return (
    w.specialization * v.specializationFit +
    w.method * v.methodFit +
    w.availability * (v.availableAtPreferred ? 1 : 0) +
    w.reliability * v.reliability +
    w.feedback * feedback +
    w.loadBalance * load +
    w.coldStartBoost * cold
  );
}

/** Reasons in rank order (max 3, user language resolved by the caller via i18n keys). */
export function reasonsFor(v: VolunteerCandidate): ReasonKey[] {
  const out: ReasonKey[] = [];
  if (v.teachesSubject) out.push('teaches_subject');
  if (v.teachesStage) out.push('teaches_stage');
  if (v.availableAtPreferred) out.push('available_time');
  if (v.methodFit >= 0.7) out.push('method_match');
  if (v.feedbackCount >= 3 && v.feedbackScore >= 0.8) out.push('highly_rated');
  if (v.reliability >= 0.8) out.push('reliable');
  if (v.isNew) out.push('new_volunteer');
  return out.slice(0, 3);
}

/** Full pipeline: filter → score → sort → reasons. */
export function match(
  candidates: VolunteerCandidate[],
  weights: MatchingWeights = DEFAULT_WEIGHTS
): MatchResult[] {
  return candidates
    .filter((v) => passesHardFilters(v, { capacityEnforced: true }))
    .map((v) => ({ v, s: score(v, weights) }))
    .sort((a, b) => b.s - a.s)
    .map(({ v }) => ({ volunteerId: v.volunteerId, reasons: reasonsFor(v) }));
}
