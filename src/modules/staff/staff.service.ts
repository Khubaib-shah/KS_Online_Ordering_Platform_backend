// ─── Staff Service ──────────────────────────────────────────────────
import bcrypt from 'bcryptjs';
import { staffRepository } from './staff.repository';

export const staffService = {
  async list(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return staffRepository.list(tenantId, skip, limit);
  },

  async invite(tenantId: string, data: any) {
    const { email, name, password, branchId, roleId } = data;
    const passwordHash = await bcrypt.hash(password, 12);

    const userData = {
      email,
      name,
      passwordHash,
      globalRole: 'TENANT_USER',
    };

    const staffProfileData = {
      roleId: roleId || null,
      branchId,
    };

    return staffRepository.create(tenantId, userData, staffProfileData);
  },

  async updatePermissions(id: string, tenantId: string, data: any) {
    return staffRepository.updatePermissions(id, tenantId, data);
  },

  async deactivate(userId: string, tenantId: string) {
    return staffRepository.deactivate(userId, tenantId);
  },
};
