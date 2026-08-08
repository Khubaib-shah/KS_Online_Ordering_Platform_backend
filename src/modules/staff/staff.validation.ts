import { z } from 'zod';

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  roleId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional(),
  password: z.string().min(8),
});

export const updatePermissionsSchema = z.object({
  roleId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
});
