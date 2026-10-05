/**
 * Session booking domain (§9 + §14B): request validation, availability,
 * reference codes, WhatsApp handoff. Pure TS — no framework imports.
 */
import { z } from 'zod';

/** Session request form (§8): minimal data, length-limited notes. */
export const sessionRequestSchema = z.object({
  stageId: z.string().uuid('booking.stage_required'),
  subjectId: z.string().uuid('booking.subject_required'),
  learningNeed: z.string().min(10, 'booking.need_too_short').max(1000, 'booking.need_too_long'),
  preferredWindow: z.object({
    // ISO strings — client sends its local intent, server stores UTC
    start: z.string().datetime({ offset: true }),
    end: z.string().datetime({ offset: true }),
  }),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type SessionRequestInput = z.infer<typeof sessionRequestSchema>;

/** Session reference: AM-S-YYYY-NNNNNN (§14B). */
export function formatSessionRef(year: number, seq: number): string {
  return `AM-S-${year}-${String(seq).padStart(6, '0')}`;
}

/** Session booking WhatsApp message (§14B templates) — MINIMUM data only:
 *  reference, stage, subject, preferred time, FIRST NAME. Never full name,
 *  school, address, phone, email, or learning-difficulty details. */
export function sessionWhatsAppMessage(params: {
  locale: 'ar' | 'en';
  reference: string;
  stage: string;
  subject: string;
  preferredTime: string;
  firstName: string;
}): string {
  if (params.locale === 'ar') {
    return [
      'السلام عليكم، أرغب في حجز جلسة تعليمية عبر منصة AND MORE.',
      `رقم الطلب: ${params.reference}`,
      `المرحلة: ${params.stage}`,
      `المادة: ${params.subject}`,
      `الوقت المفضل: ${params.preferredTime}`,
      `الاسم: ${params.firstName}`,
      'أرجو تأكيد الحجز. شكراً لكم.',
    ].join('\n');
  }
  return [
    'Hello, I would like to book an educational session on AND MORE.',
    `Request ID: ${params.reference}`,
    `Stage: ${params.stage}`,
    `Subject: ${params.subject}`,
    `Preferred time: ${params.preferredTime}`,
    `Name: ${params.firstName}`,
    'Please confirm my booking. Thank you.',
  ].join('\n');
}

/** Session lifecycle transition table (§9) — mirrors DB session_transitions. */
export const SESSION_STATUSES = [
  'requested', 'under_review', 'matched', 'pending_volunteer_confirmation',
  'confirmed', 'in_progress', 'completed', 'evaluated',
  'cancelled_by_student', 'cancelled_by_volunteer', 'cancelled_by_admin',
  'no_show_student', 'no_show_volunteer', 'expired', 'disputed',
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_TRANSITIONS: Readonly<Record<SessionStatus, readonly SessionStatus[]>> = {
  requested: ['under_review'],
  under_review: ['matched', 'expired'],
  matched: ['pending_volunteer_confirmation'],
  pending_volunteer_confirmation: ['confirmed', 'matched', 'expired'],
  confirmed: ['in_progress', 'cancelled_by_student', 'cancelled_by_volunteer', 'cancelled_by_admin'],
  in_progress: ['completed', 'no_show_student', 'no_show_volunteer'],
  completed: ['evaluated', 'disputed'],
  evaluated: ['disputed'],
  cancelled_by_student: [],
  cancelled_by_volunteer: [],
  cancelled_by_admin: [],
  no_show_student: [],
  no_show_volunteer: [],
  expired: [],
  disputed: [],
};

export function canTransitionSession(
  from: SessionStatus | null | undefined,
  to: SessionStatus | null | undefined
): boolean {
  if (!from || !to) return false;
  return SESSION_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Minimum-notice cancellation rule (§9, default 24h, configurable in settings). */
export function canCancel(
  status: SessionStatus,
  scheduledStart: Date,
  now: Date,
  minNoticeHours = 24
): boolean {
  const cancellable: SessionStatus[] = ['requested', 'matched', 'pending_volunteer_confirmation', 'confirmed'];
  if (!cancellable.includes(status)) return false;
  return scheduledStart.getTime() - now.getTime() >= minNoticeHours * 3600_000;
}

/** Timezone-correct window check (§9): does a UTC instant fall in a weekly rule? */
export function inWeeklyWindow(
  instant: Date,
  rules: ReadonlyArray<{ weekday: number; start: string; end: string }>,
  timeZone: string
): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = weekdayMap[get('weekday')];
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  return rules.some((r) => {
    if (r.weekday !== weekday) return false;
    const [sh = 0, sm = 0] = r.start.split(':').map(Number);
    const [eh = 0, em = 0] = r.end.split(':').map(Number);
    return minutes >= (sh as number) * 60 + (sm as number) && minutes < (eh as number) * 60 + (em as number);
  });
}
