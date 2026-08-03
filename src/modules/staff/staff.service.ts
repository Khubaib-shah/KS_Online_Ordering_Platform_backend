// ─── Staff Service ──────────────────────────────────────────────────
import bcrypt from 'bcryptjs';
import { staffRepository } from './staff.repository';

export const staffService = {
  async list(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return staffRepository.list(tenantId, skip, limit);
  },

  async invite(tenantId: string, data: any) {
    const { email, name, password, designation, branchId, ...perms } = data;
    const passwordHash = await bcrypt.hash(password, 12);

    const userData = {
      email,
      name,
      passwordHash,
      globalRole: 'TENANT_USER',
    };

    const staffProfileData = {
      designation,
      branchId,
      permissionOrders: perms.permissionOrders || 'MANAGE',
      permissionMenu: perms.permissionMenu || 'READ',
      permissionReports: perms.permissionReports || 'NONE',
      permissionSettings: perms.permissionSettings || 'NONE',
    };

    return staffRepository.create(tenantId, userData, staffProfileData);
  },

  async updatePermissions(id: string, data: any) {
    return staffRepository.updatePermissions(id, data);
  },

  async deactivate(userId: string) {
    return staffRepository.deactivate(userId);
  },
};
