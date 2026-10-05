/**
 * Volunteer application domain (§7): questions, validation, reference generation.
 * Pure TS — no framework imports (§3B rule 10).
 */
import { z } from 'zod';

/** Step 1: identity + background. */
export const step1Schema = z.object({
  fullName: z.string().min(2, 'app.name_required').max(120, 'app.name_too_long'),
  email: z.string().email('app.email_invalid').max(200),
  phone: z
    .string()
    .regex(/^[0-9+\s-]{7,20}$/, 'app.phone_invalid')
    .optional()
    .or(z.literal('')),
  birthYear: z
    .number()
    .int()
    .min(1930)
    .max(new Date().getFullYear() - 17, 'app.age_min_18'), // §22.2 volunteers 18+
});

/** Step 2: education + teaching profile. */
export const step2Schema = z.object({
  educationBackground: z.string().min(10, 'app.education_required').max(500),
  qualification: z.string().min(2, 'app.qualification_required').max(200),
  institution: z.string().max(200).optional().or(z.literal('')),
  experienceYears: z.number().int().min(0).max(60).default(0),
  subjectIds: z.array(z.string().uuid()).min(1, 'app.subjects_required'),
  stageIds: z.array(z.string().uuid()).min(1, 'app.stages_required'),
  languages: z.array(z.enum(['ar', 'en'])).min(1, 'app.languages_required'),
});

/** Step 3: bio + CoC. */
export const step3Schema = z.object({
  bio: z.string().max(1000).optional().or(z.literal('')),
  cocAccepted: z.literal(true, { message: 'app.coc_required' }), // HARD: §7
});

export const applicationSchema = step1Schema.merge(step2Schema).merge(step3Schema);

export type ApplicationInput = z.infer<typeof applicationSchema>;

/** Volunteer application reference: AM-V-YYYY-NNNNNN (generated DB-side; this is display-only). */
export function formatVolunteerRef(year: number, seq: number): string {
  return `AM-V-${year}-${String(seq).padStart(6, '0')}`;
}

/** WhatsApp handoff message template (§14B) — minimal data only. */
export function volunteerWhatsAppMessage(params: {
  locale: 'ar' | 'en';
  reference: string;
  fullName: string;
  specialization: string;
  subjects: string;
  stages: string;
}): string {
  if (params.locale === 'ar') {
    return [
      'السلام عليكم، أرغب في التطوع عبر منصة AND MORE.',
      `رقم الطلب: ${params.reference}`,
      `الاسم: ${params.fullName}`,
      `التخصص: ${params.specialization}`,
      `المواد: ${params.subjects}`,
      `المراحل: ${params.stages}`,
      'أرجو مراجعة طلبي. شكراً لكم.',
    ].join('\n');
  }
  return [
    'Hello, I would like to volunteer with AND MORE.',
    `Application ID: ${params.reference}`,
    `Name: ${params.fullName}`,
    `Specialization: ${params.specialization}`,
    `Subjects: ${params.subjects}`,
    `Stages: ${params.stages}`,
    'Please review my application. Thank you.',
  ].join('\n');
}

/** wa.me link builder (§14B: digits only, encodeURIComponent, %0A for newlines). */
export function waLink(number: string, message: string): string {
  const digits = number.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Sensitive-data guard: NEVER allow phones/emails/socials into the WA message (§14B). */
export function assertNoSensitiveData(message: string): void {
  // Reference codes (AM-V-YYYY-NNNNNN / AM-S-YYYY-NNNNNN) are safe-by-design —
  // strip them before scanning so digit patterns don't false-fire on them.
  const stripped = message.replace(/AM-[SV]-\d{4}-\d{6,}/g, '');
  const patterns = [
    /(\+?\d[\d\s-]{7,})/,            // phone-like
    /[\w.+-]+@[\w-]+\.[\w.]+/,       // email
    /(tiktok|instagram|snapchat|telegram|t\.me|x\.com|twitter|whatsapp)\//i, // socials incl. short domains
  ];
  for (const p of patterns) {
    if (p.test(stripped)) {
      throw new Error(`sensitive data in WhatsApp message: ${p.source}`);
    }
  }
}
