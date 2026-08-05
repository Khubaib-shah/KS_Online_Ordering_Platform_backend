import { z } from 'zod';

export const createTableSchema = z.object({
  branchId: z.string().uuid(),
  tableNumber: z.string().min(1).max(50),
  capacity: z.number().int().min(1).default(2),
  isActive: z.boolean().default(true),
});

export const updateTableSchema = z.object({
  tableNumber: z.string().min(1).max(50).optional(),
  capacity: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});
