import { z } from 'zod';

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  designation: z.enum(['OWNER', 'BRANCH_MANAGER', 'CASHIER', 'KITCHEN_STAFF', 'RIDER', 'GENERAL_STAFF']),
  branchId: z.string().uuid().optional(),
  password: z.string().min(8),
  permissionOrders: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionMenu: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionReports: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionSettings: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
});

export const updatePermissionsSchema = z.object({
  designation: z.enum(['OWNER', 'BRANCH_MANAGER', 'CASHIER', 'KITCHEN_STAFF', 'RIDER', 'GENERAL_STAFF']).optional(),
  branchId: z.string().uuid().optional().nullable(),
  permissionOrders: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionMenu: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionReports: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
  permissionSettings: z.enum(['NONE', 'READ', 'MANAGE']).optional(),
});
