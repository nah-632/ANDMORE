/**
 * Validation schemas (§13: Zod on server, shared with client).
 * Password policy: min 10 chars, upper+lower+digit (proportionate baseline).
 */
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(10, 'auth.password_too_short')
  .max(128)
  .regex(/[a-z]/, 'auth.password_needs_lower')
  .regex(/[A-Z]/, 'auth.password_needs_upper')
  .regex(/[0-9]/, 'auth.password_needs_digit');

export const signupSchema = z.object({
  email: z.string().email('auth.email_invalid').max(200),
  password: passwordSchema,
  locale: z.enum(['ar', 'en']).default('ar'),
  role: z.enum(['student', 'parent', 'volunteer']), // admin roles NEVER self-granted
  firstName: z.string().min(1).max(40),
  lastNameInitial: z.string().length(1).regex(/[A-Za-zأ-ي]/).optional(),
  birthYear: z.number().int().min(1930).max(new Date().getFullYear()).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('auth.email_invalid'),
  password: z.string().min(1).max(128),
});

export const recoverSchema = z.object({
  email: z.string().email('auth.email_invalid'),
});

export const guardianLinkSchema = z.object({
  studentEmail: z.string().email('auth.email_invalid'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
