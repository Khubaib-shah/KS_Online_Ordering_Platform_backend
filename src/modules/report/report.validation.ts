import { z } from 'zod';

export const reportQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year']).optional().default('today'),
  branchId: z.string().uuid().optional(),
});
