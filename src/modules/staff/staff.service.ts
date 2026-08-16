// ─── Staff Service ──────────────────────────────────────────────────
import bcrypt from "bcryptjs";
import { staffRepository } from "./staff.repository";
import { canMutateStaffRole } from "./staff.security";

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
      globalRole: "TENANT_USER",
    };

    const staffProfileData = {
      roleId: roleId || null,
      branchId,
    };

    return staffRepository.create(tenantId, userData, staffProfileData);
  },

  async updatePermissions(
    id: string,
    tenantId: string,
    data: any,
    actorUserId?: string,
  ) {
    return staffRepository.updatePermissions(id, tenantId, data, actorUserId);
  },

  async deactivate(userId: string, tenantId: string) {
    return staffRepository.deactivate(userId, tenantId);
  },
};

export { canMutateStaffRole };
