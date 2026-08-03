// ─── Auth Validation Schemas ────────────────────────────────────────

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().optional(),
});

export const sendOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  tenantId: z.string().uuid(),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
  tenantId: z.string().uuid(),
});
