import { z } from 'zod';

export const reportQuerySchema = z.object({
  period: z.enum(['today', 'yesterday', '7d', '30d', 'month', 'year', 'shift', 'current-shift', 'previous-shift']).optional().default('today'),
  branchId: z.string().uuid().optional(),
  cashierId: z.string().uuid().optional(),
});
