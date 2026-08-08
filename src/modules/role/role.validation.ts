import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).optional().nullable(),
  permissions: z.record(z.any()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();
