/**
 * Auth & role domain types (§4) — pure TS, no framework imports (§3B rule 10).
 */
export const APP_ROLES = [
  'student',
  'parent',
  'volunteer',
  'reviewer',
  'moderator',
  'analyst',
  'super_admin',
] as const;

export type AppRole = (typeof APP_ROLES)[number];

/** Roles allowed to hold admin powers (§4: never student+admin). */
export const ADMIN_ROLES: readonly AppRole[] = ['reviewer', 'moderator', 'analyst', 'super_admin'];

/** Volunteer lifecycle (§7). */
export const APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'interview_scheduled',
  'approved',
  'rejected',
  'needs_more_info',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Post-approval account states (§7). */
export const VOLUNTEER_STATUSES = ['active', 'suspended', 'deactivated', 'inactive'] as const;
export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number];

/** Application transition table — single source of truth (mirrors DB). */
export const APPLICATION_TRANSITIONS: Readonly<
  Record<ApplicationStatus, readonly ApplicationStatus[]>
> = {
  draft: ['submitted'],
  submitted: ['under_review'],
  under_review: ['interview_scheduled', 'approved', 'rejected', 'needs_more_info'],
  interview_scheduled: ['under_review'],
  approved: [],
  rejected: [],
  needs_more_info: ['submitted', 'under_review'],
};

/** Typed, total transition check (§3B rule 3: no string indexing, no undefined). */
export function canTransitionApplication(
  from: ApplicationStatus | null | undefined,
  to: ApplicationStatus | null | undefined
): boolean {
  if (!from || !to) return false;
  const legal: readonly ApplicationStatus[] | undefined = APPLICATION_TRANSITIONS[from];
  return legal?.includes(to) ?? false;
}

/** Public visibility gate (§7 v2: approved+active+complete+CoC; ref check optional). */
export function isPubliclyVisible(v: {
  status: VolunteerStatus;
  cocAccepted: boolean;
  refCheckStatus: 'not_required' | 'pending' | 'passed' | 'failed';
  profileComplete: boolean;
}): boolean {
  return (
    v.status === 'active' &&
    v.cocAccepted &&
    (v.refCheckStatus === 'not_required' || v.refCheckStatus === 'passed') &&
    v.profileComplete
  );
}

/** Role guard helpers. */
export function isAdminRole(role: AppRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function hasAnyRole(roles: readonly AppRole[], needed: readonly AppRole[]): boolean {
  return needed.some((r) => roles.includes(r));
}
