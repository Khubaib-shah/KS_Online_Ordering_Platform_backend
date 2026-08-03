// ─── Customer Module ────────────────────────────────────────────────

import { z } from 'zod';

export const listCustomersQuerySchema = z.object({
  search: z.string().optional(),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
