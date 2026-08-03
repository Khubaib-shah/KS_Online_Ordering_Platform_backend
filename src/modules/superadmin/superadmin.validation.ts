import { z } from 'zod';

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_PAYMENT']),
});

export const createGlobalAreaSchema = z.object({
  city: z.string().min(1),
  region: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const updateGlobalAreaSchema = z.object({
  city: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});
